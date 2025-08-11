// app/page.tsx
import ChatInterface from "./components/ChatInterface";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900">
      <ChatInterface />
    </main>
  );
}
