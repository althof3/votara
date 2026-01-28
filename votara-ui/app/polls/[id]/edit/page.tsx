"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePolls } from "@/lib/hooks/usePolls";
import { pollsApi } from "@/lib/api/client";
import type { Poll } from "@/lib/api/client";
import styles from "./edit.module.css";

export default function EditPollPage() {
  const params = useParams();
  const router = useRouter();
  const pollId = params.id as string;
  const { getPollById, loading: fetchLoading } = usePolls();
  
  const [poll, setPoll] = useState<Poll | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState<Array<{ id: number; label: string }>>([
    { id: 0, label: "" },
    { id: 1, label: "" },
  ]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const data = await getPollById(pollId);
        if (data) {
          setPoll(data);
          setTitle(data.title);
          setDescription(data.description || "");
          setOptions(data.options);
          setStartTime(data.startTime.slice(0, 16)); // Format for datetime-local
          setEndTime(data.endTime.slice(0, 16));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch poll");
      }
    };

    if (pollId) {
      fetchPoll();
    }
  }, [pollId, getPollById]);

  const handleAddOption = () => {
    const newId = options.length;
    setOptions([...options, { id: newId, label: "" }]);
  };

  const handleRemoveOption = (id: number) => {
    if (options.length <= 2) {
      alert("Poll must have at least 2 options");
      return;
    }
    setOptions(options.filter((opt) => opt.id !== id));
  };

  const handleOptionChange = (id: number, label: string) => {
    setOptions(options.map((opt) => (opt.id === id ? { ...opt, label } : opt)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!poll) return;
    
    // Validate
    if (options.some((opt) => !opt.label.trim())) {
      alert("All options must have a label");
      return;
    }

    if (new Date(startTime) >= new Date(endTime)) {
      alert("End time must be after start time");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await pollsApi.update(pollId, {
        title,
        description,
      });

      alert("Poll updated successfully!");
      router.push(`/polls/${pollId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update poll");
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = () => {
    router.push(`/polls/${pollId}/activate`);
  };

  if (fetchLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <p className={styles.loading}>Loading poll...</p>
        </div>
      </div>
    );
  }

  if (error && !poll) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <p className={styles.error}>{error}</p>
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <p className={styles.error}>Poll not found</p>
        </div>
      </div>
    );
  }

  if (poll.status !== "DRAFT") {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.warning}>
            <h2>Cannot Edit Poll</h2>
            <p>This poll is {poll.status} and cannot be edited.</p>
            <p>Only DRAFT polls can be edited.</p>
            <button onClick={() => router.push(`/polls/${pollId}`)} className={styles.button}>
              View Poll
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1>Edit Poll</h1>
          <span className={styles.badge}>DRAFT</span>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="title">Poll Title *</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's your question?"
              required
              maxLength={200}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="description">Description (optional)</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more context to your poll..."
              rows={4}
            />
          </div>

          <div className={styles.field}>
            <label>Options *</label>
            <div className={styles.options}>
              {options.map((option, index) => (
                <div key={option.id} className={styles.optionRow}>
                  <input
                    type="text"
                    value={option.label}
                    onChange={(e) => handleOptionChange(option.id, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    required
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(option.id)}
                      className={styles.removeButton}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={handleAddOption} className={styles.addButton}>
              + Add Option
            </button>
          </div>

          <div className={styles.timeFields}>
            <div className={styles.field}>
              <label htmlFor="startTime">Start Time *</label>
              <input
                id="startTime"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                disabled
              />
              <p className={styles.hint}>Cannot change start time</p>
            </div>

            <div className={styles.field}>
              <label htmlFor="endTime">End Time *</label>
              <input
                id="endTime"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                disabled
              />
              <p className={styles.hint}>Cannot change end time</p>
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={() => router.push(`/polls/${pollId}`)}
              className={styles.cancelButton}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={styles.saveButton}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={handleActivate}
              className={styles.activateButton}
            >
              Activate Poll →
            </button>
          </div>
        </form>

        <div className={styles.info}>
          <h3>📝 Editing Guidelines</h3>
          <ul>
            <li>You can only edit polls while they are in DRAFT status</li>
            <li>Title and description can be updated</li>
            <li>Options, start time, and end time cannot be changed (create a new poll instead)</li>
            <li>Once activated, the poll cannot be edited</li>
          </ul>
        </div>
      </div>
    </div>
  );
}


