import { pb } from "./pocketbase";

export type PollOption = {
  id: string;
  text: string;
};

export type PollVotes = Record<string, string[]>;

export type PollRecord = {
  id: string;
  household: string;
  question: string;
  optionsJson: string;
  votesJson: string;
  voteCountsJson?: string;
  endsAt?: string;
  isClosed?: boolean;
  allowMultiple: boolean;
  createdBy?: string;
  created?: string;
};

export type ParsedPoll = PollRecord & {
  options: PollOption[];
  votes: PollVotes;
  voteCounts: Record<string, number>;
};

function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function parsePollOptions(optionsJson: string): PollOption[] {
  try {
    const parsed = JSON.parse(optionsJson);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((option) => ({
        id: String(option?.id ?? "").trim(),
        text: String(option?.text ?? "").trim(),
      }))
      .filter((option) => option.id && option.text);
  } catch {
    return [];
  }
}

export function parsePollVotes(votesJson: string): PollVotes {
  try {
    const parsed = JSON.parse(votesJson);

    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    const rawVotes = parsed as Record<string, unknown>;

    return Object.fromEntries(
      Object.entries(rawVotes)
        .filter(([, value]) => Array.isArray(value))
        .map(([userId, value]) => [
          userId,
          (value as unknown[]).map((item) => String(item)).filter(Boolean),
        ])
    );
  } catch {
    return {};
  }
}

export function serializePollOptions(options: PollOption[]) {
  return JSON.stringify(options);
}

export function serializePollVotes(votes: PollVotes) {
  return JSON.stringify(votes);
}

export function parsePollVoteCounts(voteCountsJson?: string): Record<string, number> {
  if (!voteCountsJson) {
    return {};
  }

  try {
    const parsed = JSON.parse(voteCountsJson);

    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>)
        .map(([optionId, value]) => [optionId, Number(value)])
        .filter(([, value]) => Number.isFinite(value))
    );
  } catch {
    return {};
  }
}

export function serializePollVoteCounts(voteCounts: Record<string, number>) {
  return JSON.stringify(voteCounts);
}

export function isPollExpired(poll: Pick<ParsedPoll, "endsAt" | "isClosed">) {
  if (poll.isClosed) {
    return true;
  }

  if (!poll.endsAt) {
    return false;
  }

  const endsAt = new Date(poll.endsAt).getTime();
  return Number.isFinite(endsAt) && endsAt <= Date.now();
}

export function parsePollRecord(record: PollRecord): ParsedPoll {
  return {
    ...record,
    options: parsePollOptions(record.optionsJson),
    votes: parsePollVotes(record.votesJson),
    voteCounts: parsePollVoteCounts(record.voteCountsJson),
  };
}

export async function loadPolls(householdId: string): Promise<ParsedPoll[]> {
  const records = await pb.collection("polls").getFullList<PollRecord>({
    filter: `household = "${householdId}"`,
    sort: "-created",
  });

  return records.map(parsePollRecord);
}

export async function createPoll(input: {
  householdId: string;
  question: string;
  optionTexts: string[];
  allowMultiple: boolean;
  endsAt?: string;
}) {
  const options = input.optionTexts
    .map((text) => text.trim())
    .filter(Boolean)
    .map((text) => ({
      id: createId("option"),
      text,
    }));

  if (options.length < 2) {
    throw new Error("Polls need at least two options");
  }

  return await pb.collection("polls").create({
    household: input.householdId,
    question: input.question.trim(),
    optionsJson: serializePollOptions(options),
    votesJson: serializePollVotes({}),
    voteCountsJson: serializePollVoteCounts({}),
    endsAt: input.endsAt ?? "",
    isClosed: false,
    allowMultiple: input.allowMultiple,
    createdBy: pb.authStore.model?.id,
  });
}

export async function closePoll(pollId: string) {
  return await pb.collection("polls").update(pollId, {
    isClosed: true,
  });
}

export async function updatePollVote(
  poll: ParsedPoll,
  userId: string,
  selectedOptionIds: string[]
) {
  const nextVotes = {
    ...poll.votes,
    [userId]: selectedOptionIds,
  };

  const nextVoteCounts = Object.fromEntries(
    poll.options.map((option) => [
      option.id,
      Object.values(nextVotes).filter((optionIds) => optionIds.includes(option.id))
        .length,
    ])
  );

  return await pb.collection("polls").update(poll.id, {
    question: poll.question,
    optionsJson: serializePollOptions(poll.options),
    votesJson: serializePollVotes(nextVotes),
    voteCountsJson: serializePollVoteCounts(nextVoteCounts),
    endsAt: poll.endsAt ?? "",
    isClosed: poll.isClosed ?? false,
    allowMultiple: poll.allowMultiple,
    createdBy: poll.createdBy ?? pb.authStore.model?.id,
  });
}
