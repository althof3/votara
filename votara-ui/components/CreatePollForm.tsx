'use client';

import { useState } from 'react';
import { usePollCreation } from '@/lib/hooks/usePollCreation';
import { useAuth } from '@/lib/hooks/useAuth';
import type { CreatePollRequest } from '@/lib/api/polls';
import styles from './CreatePollForm.module.css';

export function CreatePollForm() {
  const { user } = useAuth();
  const { createDraftPoll, loading, error, currentStep } = usePollCreation();

  const [formData, setFormData] = useState<CreatePollRequest>({
    title: '',
    description: '',
    options: [
      { id: 0, label: '' },
      { id: 1, label: '' },
    ],
    startTime: '',
    endTime: '',
  });

  const [createdPollId, setCreatedPollId] = useState<string | null>(null);

  const handleAddOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, { id: formData.options.length, label: '' }],
    });
  };

  const handleRemoveOption = (index: number) => {
    if (formData.options.length <= 2) return; // Minimum 2 options
    setFormData({
      ...formData,
      options: formData.options.filter((_, i) => i !== index).map((opt, i) => ({ ...opt, id: i })),
    });
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index].label = value;
    setFormData({ ...formData, options: newOptions });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('Please login first');
      return;
    }

    // Validate
    if (!formData.title || formData.options.some((opt) => !opt.label)) {
      alert('Please fill all fields');
      return;
    }

    const poll = await createDraftPoll(formData);
    if (poll) {
      setCreatedPollId(poll.id);
      alert(`Poll created successfully! ID: ${poll.id}`);
      // Reset form
      setFormData({
        title: '',
        description: '',
        options: [
          { id: 0, label: '' },
          { id: 1, label: '' },
        ],
        startTime: '',
        endTime: '',
      });
    }
  };

  return (
    <div className={styles.form}>
      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {createdPollId && (
        <div className={styles.success}>
          <p className={styles.successTitle}>Poll created! ID: {createdPollId}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Title */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className={styles.input}
            placeholder="Enter poll title"
            required
          />
        </div>

        {/* Description */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className={styles.textarea}
            placeholder="Enter poll description"
            rows={3}
          />
        </div>

        {/* Options */}
        <div className={styles.optionsContainer}>
          <label className={styles.label}>Options *</label>
          {formData.options.map((option, index) => (
            <div key={index} className={styles.optionItem}>
              <input
                type="text"
                value={option.label}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                className={`${styles.input} ${styles.optionInput}`}
                placeholder={`Option ${index + 1}`}
                required
              />
              {formData.options.length > 2 && (
                <button
                  type="button"
                  onClick={() => handleRemoveOption(index)}
                  className={styles.removeButton}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddOption}
            className={styles.addButton}
            disabled={formData.options.length >= 256}
          >
            Add Option
          </button>
        </div>

        {/* Start Time */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Start Time *</label>
          <input
            type="datetime-local"
            value={formData.startTime.slice(0, 16)}
            onChange={(e) => setFormData({ ...formData, startTime: new Date(e.target.value).toISOString() })}
            className={styles.input}
            required
          />
        </div>

        {/* End Time */}
        <div className={styles.formGroup}>
          <label className={styles.label}>End Time *</label>
          <input
            type="datetime-local"
            value={formData.endTime.slice(0, 16)}
            onChange={(e) => setFormData({ ...formData, endTime: new Date(e.target.value).toISOString() })}
            className={styles.input}
            required
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !user}
          className={styles.submitButton}
        >
          {loading ? `Creating... (${currentStep})` : 'Create Draft Poll'}
        </button>

        {!user && (
          <p className={styles.error}>Please login to create a poll</p>
        )}
      </form>
    </div>
  );
}

