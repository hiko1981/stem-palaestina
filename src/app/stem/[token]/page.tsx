import Card from "@/components/ui/Card";
import BallotVoteForm from "@/components/features/BallotVoteForm";
import MobileGate from "@/components/features/MobileGate";

interface BallotPageProps {
  params: Promise<{ token: string }>;
}

export default async function BallotPage({ params }: BallotPageProps) {
  const { token } = await params;

  return (
    <MobileGate>
      <div className="mx-auto max-w-xl px-4 py-16">
        <Card>
          <BallotVoteForm token={token} />
        </Card>
      </div>
    </MobileGate>
  );
}
