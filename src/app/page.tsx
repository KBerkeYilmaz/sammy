import { HydrateClient } from "~/trpc/server";
import { ChatShell } from "~/app/_components/chat-shell";

export default function Home() {
  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col bg-background">
        <ChatShell />
      </main>
    </HydrateClient>
  );
}
