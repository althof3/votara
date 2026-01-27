'use client';

import { useState } from 'react';
import { usePollCreation } from '@/lib/hooks/usePollCreation';
import { useAuth } from '@/lib/hooks/useAuth';
import type { CreatePollRequest } from '@/lib/api/polls';

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
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Create New Poll</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {createdPollId && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          Poll created! ID: {createdPollId}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-2">Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Enter poll title"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Enter poll description"
            rows={3}
          />
        </div>

        {/* Options */}
        <div>
          <label className="block text-sm font-medium mb-2">Options *</label>
          {formData.options.map((option, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={option.label}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder={`Option ${index + 1}`}
                required
              />
              {formData.options.length > 2 && (
                <button
                  type="button"
                  onClick={() => handleRemoveOption(index)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddOption}
            className="mt-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            disabled={formData.options.length >= 256}
          >
            Add Option
          </button>
        </div>

        {/* Start Time */}
        <div>
          <label className="block text-sm font-medium mb-2">Start Time *</label>
          <input
            type="datetime-local"
            value={formData.startTime.slice(0, 16)}
            onChange={(e) => setFormData({ ...formData, startTime: new Date(e.target.value).toISOString() })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* End Time */}
        <div>
          <label className="block text-sm font-medium mb-2">End Time *</label>
          <input
            type="datetime-local"
            value={formData.endTime.slice(0, 16)}
            onChange={(e) => setFormData({ ...formData, endTime: new Date(e.target.value).toISOString() })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !user}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? `Creating... (${currentStep})` : 'Create Draft Poll'}
        </button>

        {!user && (
          <p className="text-sm text-red-600 text-center">Please login to create a poll</p>
        )}
      </form>
    </div>
  );
}

