import KonsensusSubpage from "@/components/konsensus-subpage";
import VotersForm from "./voters-form";

export default function VotersPage() {
  return (
    <KonsensusSubpage title="Voters">
      <VotersForm />
    </KonsensusSubpage>
  );
}
