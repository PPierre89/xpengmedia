/**
 * Tests de non-régression des protections du proxy (/api/proxy).
 * Lancement : npm run test:security
 *
 * Ces cas correspondent aux vulnérabilités identifiées lors de l'audit de
 * sécurité de la mise en place de l'auto-hébergement :
 *   1. XSS same-origin par reflet du Content-Type distant
 *   2. SSRF : garde-fou contourné par redirection HTTP
 *   3. SSRF : garde-fou contourné par littéral IPv6 encapsulant une IPv4
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { isPrivateIp, assertTargetAllowed, resolveContentType } from './server.js';

test('IPv4 privées et publiques', () => {
  for (const ip of ['127.0.0.1', '10.1.2.3', '192.168.1.1', '172.16.0.1', '169.254.169.254',
                    '100.64.0.1', '198.18.0.1', '192.0.0.1', '0.0.0.0', '239.1.1.1']) {
    assert.equal(isPrivateIp(ip), true, `${ip} doit être privée`);
  }
  for (const ip of ['8.8.8.8', '1.1.1.1', '203.0.113.5']) {
    assert.equal(isPrivateIp(ip), false, `${ip} doit être publique`);
  }
});

test('IPv6 : formes encapsulant une IPv4 privée (contournement de l\'audit)', () => {
  for (const ip of [
    '::ffff:7f00:1',            // 127.0.0.1 en hexadécimal
    '::ffff:c0a8:101',          // 192.168.1.1 en hexadécimal
    '::ffff:127.0.0.1',         // forme pointée
    '::ffff:192.168.1.1',
    '0:0:0:0:0:ffff:c0a8:101',  // forme non compressée
    '::7f00:1',                 // IPv4-compatible
    '64:ff9b::c0a8:101',        // NAT64
    '2002:c0a8:101::',          // 6to4
    '::1', '::', 'fe80::1', 'fd00::1', 'fc00::1', 'ff02::1',
  ]) {
    assert.equal(isPrivateIp(ip), true, `${ip} doit être refusée`);
  }
  for (const ip of ['2606:4700:4700::1111', '2001:4860:4860::8888', '::ffff:808:808']) {
    assert.equal(isPrivateIp(ip), false, `${ip} doit être publique`);
  }
});

test('le parseur d\'URL normalise en hexadécimal : la cible reste refusée', () => {
  // new URL('http://[::ffff:192.168.1.1]/') sérialise en [::ffff:c0a8:101]
  assert.equal(new URL('http://[::ffff:192.168.1.1]/').hostname, '[::ffff:c0a8:101]');
  assert.throws(() => assertTargetAllowed(new URL('http://[::ffff:192.168.1.1]/')), /réseau privé/);
});

test('protocoles et adresses littérales refusés', () => {
  for (const url of ['file:///etc/passwd', 'gopher://x/', 'data:text/html,x']) {
    assert.throws(() => assertTargetAllowed(new URL(url)), /Protocole non supporté/);
  }
  for (const url of ['http://127.0.0.1/', 'http://[::ffff:c0a8:101]/admin', 'http://169.254.169.254/']) {
    assert.throws(() => assertTargetAllowed(new URL(url)), /réseau privé/);
  }
  for (const url of ['http://8.8.8.8/', 'https://example.com/']) {
    assert.doesNotThrow(() => assertTargetAllowed(new URL(url)));
  }
});

test('aucun contenu actif n\'est renvoyé sur notre origine', () => {
  for (const ct of ['text/html', 'text/html; charset=utf-8', 'image/svg+xml',
                    'application/xhtml+xml', 'application/javascript', 'text/xml', '']) {
    const { contentType, downgraded } = resolveContentType(ct);
    assert.equal(contentType, 'application/octet-stream', `${ct} doit être déclassé`);
    assert.equal(downgraded, true);
  }
});

test('les flux légitimes traversent sans altération', () => {
  for (const ct of ['application/json', 'video/mp2t', 'video/mp4', 'audio/mpeg',
                    'application/vnd.apple.mpegurl', 'application/x-mpegurl', 'image/jpeg']) {
    const { contentType, downgraded } = resolveContentType(ct);
    assert.equal(contentType, ct);
    assert.equal(downgraded, false, `${ct} ne doit pas être déclassé`);
  }
});
