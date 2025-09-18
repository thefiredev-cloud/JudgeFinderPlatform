import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const spec = {
    openapi: '3.0.3',
    info: {
      title: 'JudgeFinder API',
      version: '0.1.0',
      description: 'Public endpoints for coverage, freshness, and v1 analytics. In production, v1 requires x-api-key unless disabled.'
    },
    servers: [{ url: '/' }],
    components: {
      securitySchemes: {
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key'
        }
      }
    },
    security: [{ apiKey: [] }],
    paths: {
      '/api/stats/judges': {
        get: {
          summary: 'Judges coverage and freshness',
          responses: {
            '200': { description: 'OK' }
          }
        }
      },
      '/api/stats/courts': {
        get: {
          summary: 'Courts coverage and breakdown',
          responses: { '200': { description: 'OK' } }
        }
      },
      '/api/stats/cases': {
        get: {
          summary: 'Cases count and freshness',
          responses: { '200': { description: 'OK' } }
        }
      },
      '/api/v1/judges/{id}': {
        get: {
          summary: 'Canonical judge profile',
          parameters: [{ name: 'id', in: 'path', required: true }],
          responses: { '200': { description: 'OK' } }
        }
      },
      '/api/v1/judges/search': {
        get: {
          summary: 'Fuzzy search with canonical IDs',
          parameters: [
            { name: 'q', in: 'query', required: true },
            { name: 'court', in: 'query', required: false },
            { name: 'alias', in: 'query', required: false }
          ],
          responses: { '200': { description: 'OK' } }
        }
      },
      '/api/v1/judges/export': {
        get: {
          summary: 'Bulk judges export (CSV default)',
          parameters: [
            { name: 'page', in: 'query', required: false },
            { name: 'per_page', in: 'query', required: false },
            { name: 'format', in: 'query', required: false, description: 'csv or json (default csv)' }
          ],
          responses: { '200': { description: 'OK' } }
        }
      },
      '/api/v1/judges/{id}/aliases': {
        get: {
          summary: 'Aliases and position history',
          parameters: [{ name: 'id', in: 'path', required: true }],
          responses: { '200': { description: 'OK' } }
        }
      },
      '/api/v1/judges/{id}/analytics/motions': {
        get: {
          summary: 'Motion grant/deny analytics',
          parameters: [
            { name: 'id', in: 'path', required: true },
            { name: 'type', in: 'query', required: false },
            { name: 'case_type', in: 'query', required: false },
            { name: 'since', in: 'query', required: false },
            { name: 'format', in: 'query', required: false, description: 'csv or json (default json)' }
          ],
          responses: { '200': { description: 'OK' } }
        }
      },
      '/api/v1/analytics/time_to_ruling': {
        get: {
          summary: 'Time-to-ruling forecasts',
          parameters: [
            { name: 'judge_id', in: 'query', required: true },
            { name: 'motion', in: 'query', required: false },
            { name: 'case_type', in: 'query', required: false },
            { name: 'format', in: 'query', required: false, description: 'csv or json (default json)' }
          ],
          responses: { '200': { description: 'OK' } }
        }
      }
    }
  }

  return NextResponse.json(spec, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' }
  })
}


