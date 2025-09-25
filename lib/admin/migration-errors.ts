export interface ColumnCheckResult {
  judgeSlug: boolean
  courtSlug: boolean
  judgeColumns: string[]
  courtColumns: string[]
}

export class MissingColumnError extends Error {
  constructor(public readonly status: ColumnCheckResult) {
    super('Slug columns missing from database')
  }
}

