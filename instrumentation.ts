export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { bootPersonalListeners } = await import("@/lib/telegram-personal");
    await bootPersonalListeners();

    const { bootAutomationScheduler } = await import("@/lib/automation-scheduler");
    bootAutomationScheduler();
  }
}
