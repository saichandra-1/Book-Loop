import React, { useState } from "react";
import { MapPin } from "lucide-react";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationCoords, setLocationCoords] = useState<{lat: number, lng: number} | null>(null);
  const [locationAddress, setLocationAddress] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [placeQuery, setPlaceQuery] = useState("");

   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: name === "rating" ? Number(value) : value, // Ensure rating is a number
    });
  };

  const DUMMY_COVER = "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop&auto=format";

  const getCurrentLocation = async () => {
    const query = placeQuery.trim() || form.description.trim() || form.title.trim();
    if (!placeQuery.trim()) {
      // Encourage explicit place input for accuracy
      alert('Please enter the village/town/city for the book location.');
      return;
    }
    setIsGettingLocation(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`,
        { headers: { 'User-Agent': 'BookLoop/1.0 (support@example.com)' } as any }
      );
      if (!response.ok) {
        if (response.status === 429) {
          alert('Rate limit reached. Please try again later.');
        } else {
          alert('Error searching location. Please try again.');
        }
        return;
      }
      const data: Array<{ lat: string; lon: string; display_name: string }> = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        alert('No results. Check spelling or try a nearby place.');
        return;
      }
      const first = data[0];
      const coords = { lat: parseFloat(first.lat), lng: parseFloat(first.lon) };
      setLocationCoords(coords);
      setLocationAccuracy(null);
      setLocationAddress(first.display_name);
    } catch (e) {
      alert('Failed to search location. Please try again.');
    } finally {
      setIsGettingLocation(false);
    }
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError(null);
  try {
    const fallbackFromOwner = owner.location && owner.location.coordinates && owner.location.coordinates.length === 2
      ? { lat: owner.location.coordinates[1], lng: owner.location.coordinates[0] }
      : null;

    const effectiveCoords = locationCoords || fallbackFromOwner;
    const effectiveAddress = locationAddress || owner.location?.address || '';

    const locationData = effectiveCoords ? {
      coordinates: effectiveCoords,
      address: effectiveAddress
    } : null;

    const res = await api.post("addbook", {
      ...form,
      cover: form.cover.trim() ? form.cover : DUMMY_COVER, // Use dummy if empty
      ownerId: owner.id,
      ownerName: owner.name,
      available: true,
      rating: form.rating,
      reviews: 0,
      location: locationData,
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
          
          {/* Location Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Book Location</label>
            <div className="space-y-3">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={locationAddress}
                  onChange={(e) => setLocationAddress(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter book location (e.g., San Francisco, CA)"
                />
              </div>
              <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
                className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MapPin className="w-4 h-4" />
                <span>{isGettingLocation ? 'Searching...' : 'Search Location'}</span>
              </button>
                {locationCoords && (
                  <span className="text-xs text-gray-600">
                    {locationCoords.lat.toFixed(4)}, {locationCoords.lng.toFixed(4)}
                    {locationAccuracy !== null && ` (±${Math.round(locationAccuracy)}m)`}
                  </span>
                )}
              </div>
              <div>
                <input
                  type="text"
                  value={placeQuery}
                  onChange={(e) => setPlaceQuery(e.target.value)}
                  className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Type village/town/city (e.g., Podili)"
                />
              </div>
            </div>
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
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Book"}
          </button>
        </form>
      </div>
    </div>
  );
};