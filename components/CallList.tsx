"use client";

import { useGetCalls } from "@/hooks/useGetCalls";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CallRecording } from "@stream-io/video-client";
import { Call } from "@stream-io/video-react-sdk";
import MeetingCard from "@/components/MeetingCard";
import Loader from "@/components/Loader";
import { useToast } from "@/components/ui/use-toast";

interface CallListProps {
  type: "upcoming" | "ended" | "recordings";
}

export default function CallList({ type }: CallListProps) {
  const { endedCalls, upcomingCalls, callRecordings, isLoading } =
    useGetCalls();
  const router = useRouter();
  const [recordings, setRecordings] = useState<CallRecording[]>([]);
  const { toast } = useToast();

  function getCalls() {
    switch (type) {
      case "ended":
        return endedCalls;
      case "recordings":
        return recordings;
      case "upcoming":
        return upcomingCalls;
      default:
        return [];
    }
  }

  function getNoCallsMessage() {
    switch (type) {
      case "ended":
        return "No previous calls";
      case "recordings":
        return "No recordings";
      case "upcoming":
        return "No upcoming calls";
      default:
        return "";
    }
  }

  useEffect(() => {
    async function fetchRecordings() {
      try {
        const callData = await Promise.all(
          callRecordings.map((meeting) => meeting.queryRecordings()),
        );
        const recordings = callData
          .filter((call) => call.recordings.length > 0)
          .flatMap((call) => call.recordings);

        setRecordings(recordings);
      } catch (error) {
        toast({ title: "Try again later" });
      }
    }
    if (type === "recordings") fetchRecordings();
  }, [type, callRecordings]);

  const calls = getCalls();
  const noCallsMessage = getNoCallsMessage();

  if (isLoading) return <Loader />;

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      {calls && calls.length > 0 ? (
        calls.map((meeting: Call | CallRecording) => {
          return (
            <MeetingCard
              key={(meeting as Call).id}
              icon={
                type === "ended"
                  ? "/icons/previous.svg"
                  : type === "upcoming"
                    ? "/icons/upcoming.svg"
                    : "/icons/recordings.svg"
              }
              title={
                (meeting as Call).state?.custom.description.substring(0, 26) ||
                (meeting as CallRecording).filename?.substring(0, 20) ||
                "No description"
              }
              date={
                (meeting as Call).state?.startsAt?.toLocaleString() ||
                (meeting as CallRecording).start_time.toLocaleString()
              }
              isPreviousMeeting={type === "ended"}
              buttonIcon1={
                type === "recordings" ? "/icons/play.svg" : undefined
              }
              buttonText={type === "recordings" ? "Play" : "Start"}
              link={
                type === "recordings"
                  ? (meeting as CallRecording).url
                  : `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${(meeting as Call).id}`
              }
              handleClick={
                type === "recordings"
                  ? () => router.push((meeting as CallRecording).url)
                  : () => router.push(`/meeting/${(meeting as Call).id}`)
              }
            />
          );
        })
      ) : (
        <h1>{noCallsMessage}</h1>
      )}
    </div>
  );
}
