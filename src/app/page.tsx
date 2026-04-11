import { HydrateClient } from "~/trpc/server";
import { ChatShell } from "~/app/_components/chat-shell";

export default function Home() {
  return (
    <HydrateClient>
      <main className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <ChatShell />
      </main>
    </HydrateClient>
  );
}
