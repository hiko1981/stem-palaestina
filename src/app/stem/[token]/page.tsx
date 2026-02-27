import Card from "@/components/ui/Card";
import BallotVoteForm from "@/components/features/BallotVoteForm";
import MobileGate from "@/components/features/MobileGate";

interface BallotPageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ r?: string; cid?: string }>;
}

export default async function BallotPage({ params, searchParams }: BallotPageProps) {
  const { token } = await params;
  const { r, cid } = await searchParams;

  return (
    <MobileGate>
      <div className="mx-auto max-w-xl px-4 py-16">
        <Card>
          <BallotVoteForm token={token} role={r} candidateId={cid} />
        </Card>
      </div>
    </MobileGate>
  );
}
