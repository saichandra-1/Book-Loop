import React, { useState } from "react";
import api from "../api"
import { Book, User } from "../App";

interface AddBookProps {
  owner: User;
  onClose: () => void;
  onBookAdded: (book: Book) => void;
}

export const AddBook: React.FC<AddBookProps> = ({ owner, onClose, onBookAdded }) => {
  const [form, setForm] = useState({
    title: "",
    author: "",
    genre: "",
    language: "English",
    description: "",
    cover: "" ,
    condition: "good",
    rating: 1, 
  });
  const [tradeForm, setTradeForm] = useState({
    price: '',
    isForSale: false,
    ownerContact: '',
    pincode: '',
    address: '',
  });
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: name === "rating" ? Number(value) : value, // Ensure rating is a number
    });
  };

  const DUMMY_COVER = "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop&auto=format";

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError(null);
  try {
    const res = await api.post("addbook", {
      ...form,
      cover: form.cover.trim() ? form.cover : DUMMY_COVER, // Use dummy if empty
      ownerId: owner.id,
      ownerName: owner.name,
      available: true,
      rating: form.rating,
      reviews: 0,
      isForSale: tradeForm.isForSale,
      price: tradeForm.price ? Number(tradeForm.price) : null,
      ownerContact: tradeForm.ownerContact,
      location: {
        city: null,
        state: null,
        country: null,
        pincode: tradeForm.pincode || null,
        address: tradeForm.address || null,
        coordinates: { lat: null, lng: null }
      }
    });
    onBookAdded(res.data);
    onClose();
  } catch (err: any) {
    setError(err.response?.data?.message || "Failed to add book");
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
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Add a New Book</h2>
        <form className="space-y-4" onSubmit={(e) => {
          if (step === 1) {
            e.preventDefault();
            setStep(2);
            return;
          }
          handleSubmit(e);
        }}>
          {step === 1 && (
            <>
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
                <label className="block text-sm font-medium text-gray-700">Rating</label>
                <select
                  name="rating"
                  value={form.rating}
                  onChange={handleChange}
                  required
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                >
                  <option value={1}>1 - Poor</option>
                  <option value={2}>2</option>
                  <option value={3}>3 - Average</option>
                  <option value={4}>4</option>
                  <option value={5}>5 - Excellent</option>
                </select>
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
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Trade Details</h3>
                <button type="button" className="text-sm text-blue-600" onClick={() => setStep(1)}>Back to book</button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Is for sale?</label>
                <select
                  value={tradeForm.isForSale ? 'yes' : 'no'}
                  onChange={(e) => setTradeForm({ ...tradeForm, isForSale: e.target.value === 'yes' })}
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                >
                  <option value="no">No (for exchange)</option>
                  <option value="yes">Yes (buyer can purchase)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Price</label>
                <input
                  value={tradeForm.price}
                  onChange={(e) => setTradeForm({ ...tradeForm, price: e.target.value })}
                  type="number"
                  min="0"
                  step="1"
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  placeholder="Enter price (optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact (required)</label>
                <input
                  value={tradeForm.ownerContact}
                  onChange={(e) => setTradeForm({ ...tradeForm, ownerContact: e.target.value })}
                  required
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  placeholder="Email or phone"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Pincode (required)</label>
                <input
                  value={tradeForm.pincode}
                  onChange={(e) => setTradeForm({ ...tradeForm, pincode: e.target.value })}
                  required
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  placeholder="e.g. 560001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <textarea
                  value={tradeForm.address}
                  onChange={(e) => setTradeForm({ ...tradeForm, address: e.target.value })}
                  rows={2}
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  placeholder="Street, area"
                />
              </div>
            </>
          )}
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            disabled={loading}
          >
            {loading ? (step === 1 ? "Next..." : "Adding...") : (step === 1 ? "Next" : "Add Book")}
          </button>
        </form>
      </div>
    </div>
  );
};