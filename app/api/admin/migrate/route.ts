import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { isAdmin } from '@/lib/auth/is-admin'
import { MigrationCoordinator } from '@/lib/admin/migration-coordinator'
import { MissingColumnError } from '@/lib/admin/migration-errors'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await assertAdminAccess()
    const coordinator = await MigrationCoordinator.initialize()
    const result = await coordinator.executeSlugBackfill()

    return NextResponse.json({
      success: true,
      message: 'Slug generation completed successfully',
      updated: {
        judges: result.updatedJudges,
        courts: result.updatedCourts,
      },
      samples: {
        judges: result.sampleJudges,
        courts: result.sampleCourts,
      },
    })
  } catch (error) {
    if (error instanceof MissingColumnError) {
      return NextResponse.json<{ error: string; details: string; status: unknown }>(
        {
          error: error.message,
          details: 'Run SQL migration manually in Supabase dashboard first',
          status: error.status,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

async function assertAdminAccess(): Promise<void> {
  const { userId } = await auth()
  if (!userId || !(await isAdmin())) {
    throw new Error('Forbidden')
  }
}