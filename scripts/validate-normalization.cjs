#!/usr/bin/env node

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'commonjs', moduleResolution: 'node' })
require('ts-node/register/transpile-only')
require('tsconfig-paths/register')

const assert = require('node:assert/strict')
const {
  createDocketHash,
  normalizeCaseNumber,
  normalizeJurisdiction,
  normalizeOutcomeLabel,
  normalizePartyRole,
  toTitle
} = require('../lib/sync/normalization')

function testNormalizePartyRole() {
  assert.equal(normalizePartyRole('Pltf'), 'plaintiff')
  assert.equal(normalizePartyRole('DEFENDANT'), 'defendant')
  assert.equal(normalizePartyRole('Guardian Ad Litem'), 'guardian ad litem')
  assert.equal(normalizePartyRole(null), null)
}

function testNormalizeOutcomeLabel() {
  assert.deepEqual(normalizeOutcomeLabel('dismissed without prejudice'), {
    label: 'Dismissed',
    category: 'dismissed'
  })
  assert.deepEqual(normalizeOutcomeLabel('settlement reached'), {
    label: 'Settled',
    category: 'settled'
  })
  assert.deepEqual(normalizeOutcomeLabel('Judgment entered for PLAINTIFF'), {
    label: 'Judgment for Plaintiff',
    category: 'judgment_plaintiff'
  })
  assert.deepEqual(normalizeOutcomeLabel(''), { label: null, category: 'other' })
}

function testNormalizeJurisdiction() {
  assert.equal(normalizeJurisdiction('United States'), 'US')
  assert.equal(normalizeJurisdiction('ca'), 'CA')
  assert.equal(normalizeJurisdiction('California Superior Court'), 'CA')
  assert.equal(normalizeJurisdiction('NY'), 'NY')
}

function testNormalizeCaseNumber() {
  const { display, key } = normalizeCaseNumber('22-cv-00123   abc')
  assert.equal(display, '22-CV-00123 ABC')
  assert.equal(key, '22CV00123ABC')

  const fallback = normalizeCaseNumber('', 42)
  assert.equal(fallback.display, '42')
  assert.equal(fallback.key, '42')
}

function testCreateDocketHash() {
  const hashA = createDocketHash({
    caseNumberKey: '22CV00123ABC',
    jurisdiction: 'CA',
    judgeId: 'judge-123',
    courtlistenerId: '98765',
    filingDate: '2024-02-01'
  })

  const hashB = createDocketHash({
    caseNumberKey: '22CV00123ABC',
    jurisdiction: 'ca',
    judgeId: 'judge-123',
    courtlistenerId: '98765',
    filingDate: '2024-02-01'
  })

  assert.equal(hashA, hashB)
  assert.notEqual(hashA, null)

  const hashDifferent = createDocketHash({
    caseNumberKey: '22CV00123ABC',
    jurisdiction: 'CA',
    judgeId: 'judge-123',
    courtlistenerId: '99999',
    filingDate: '2024-02-01'
  })

  assert.notEqual(hashA, hashDifferent)
}

function testToTitle() {
  assert.equal(toTitle('summary_judgment_granted'), 'Summary Judgment Granted')
  assert.equal(toTitle('  mixed_CASE value '), 'Mixed Case Value')
}

function run() {
  testNormalizePartyRole()
  testNormalizeOutcomeLabel()
  testNormalizeJurisdiction()
  testNormalizeCaseNumber()
  testCreateDocketHash()
  testToTitle()

  console.log('✓ normalization helpers verified')
}

run()
