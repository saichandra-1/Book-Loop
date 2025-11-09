import React, { useState } from "react";
import api from "../api"
import { Book } from "../App";

interface EditBookProps {
  book: Book;
  onClose: () => void;
  onBookUpdated: (book: Book) => void;
}

export const EditBook: React.FC<EditBookProps> = ({ book, onClose, onBookUpdated }) => {
  const [form, setForm] = useState({
    title: book.title,
    author: book.author,
    genre: book.genre,
    language: book.language,
    description: book.description,
    cover: book.cover,
    condition: book.condition,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const DUMMY_COVER = "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop&auto=format";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.put(`books/${book.id}`, {
        ...form,
        cover: form.cover.trim() ? form.cover : DUMMY_COVER,
      });
      onBookUpdated(res.data);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update book");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-8 relative">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Edit Book</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              className="mt-1 w-full border rounded-lg px-3 py-2"
              placeholder="Book Title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Author</label>
            <input
              name="author"
              value={form.author}
              onChange={handleChange}
              required
              className="mt-1 w-full border rounded-lg px-3 py-2"
              placeholder="Author Name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Genre</label>
            <input
              name="genre"
              value={form.genre}
              onChange={handleChange}
              required
              className="mt-1 w-full border rounded-lg px-3 py-2"
              placeholder="e.g. Fiction, Mystery"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Language</label>
            <input
              name="language"
              value={form.language}
              onChange={handleChange}
              required
              className="mt-1 w-full border rounded-lg px-3 py-2"
              placeholder="e.g. English"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              className="mt-1 w-full border rounded-lg px-3 py-2"
              rows={3}
              placeholder="Short description about the book"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Cover Image URL</label>
            <input
              name="cover"
              value={form.cover}
              onChange={handleChange}
              className="mt-1 w-full border rounded-lg px-3 py-2"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Condition</label>
            <select
              name="condition"
              value={form.condition}
              onChange={handleChange}
              className="mt-1 w-full border rounded-lg px-3 py-2"
            >
              <option value="new">New</option>
              <option value="like-new">Like New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
            </select>
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
};