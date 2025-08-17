// Stripe stub - Revenue system is currently inactive
// Platform has pivoted to free public service per CLAUDE.md

export const stripe = {
  checkout: {
    sessions: {
      create: async (_options: any): Promise<{ id: string; url: string }> => {
        throw new Error('Stripe integration is currently disabled - platform is free')
      }
    }
  }
}