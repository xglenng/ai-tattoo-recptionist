import { DemoBooking } from "@/components/demo-booking";

export default function Home() {
  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 40 }}>
      <h1>AI Tattoo Receptionist</h1>
      <p>Initial MVP vertical slice.</p>
      <DemoBooking />
    </main>
  );
}
