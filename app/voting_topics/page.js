import KonsensusSubpage from "@/components/konsensus-subpage";
import VotingTopicsForm from "./voting-topics-form";

export default function VotingTopicsPage() {
  return (
    <KonsensusSubpage title="Voting topics">
      <VotingTopicsForm />
    </KonsensusSubpage>
  );
}
