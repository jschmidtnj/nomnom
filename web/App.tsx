
import React, { useState, useEffect, useMemo } from 'react';
import { Restaurant, Coordinates, SortOption } from './types';
import { fetchRecommendedRestaurants } from './services/restaurantFetcher';
import { calculateDistance } from './utils';
import RestaurantCard from './components/RestaurantCard';
import MapView from './components/MapView';
import SignIn from './components/SignIn';
import {
  Map as MapIcon,
  List as ListIcon,
  ChefHat,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  Star,
  LogIn,
  LogOut,
  ShieldCheck,
  X
} from 'lucide-react';
import { uploadRestaurants } from './services/restaurantUploader';

const App: React.FC = () => {
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>(SortOption.DISTANCE);
  const [viewMode, setViewMode] = useState<'split' | 'map' | 'list'>('split');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // State for Authentication
  const [currentView, setCurrentView] = useState<'discovery' | 'signin'>('discovery');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [accessToken, setAccessToken] = useState<string>('');

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(coords);
          handleFetchRestaurants(coords);
        },
        (err) => {
          console.error(err);
          setError("Location access denied. Please enable location to find restaurants near you.");
          const fallback = { lat: 37.7749, lng: -122.4194 };
          setUserLocation(fallback);
          handleFetchRestaurants(fallback);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
    }
  }, []);

  const uploadFileRef = React.useRef<HTMLInputElement>(null);

  const handleUploadFile = () => {
    uploadFileRef.current.click();
  };

  const handleUploadFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileObj = event.target.files && event.target.files[0];
    if (!fileObj) {
      return;
    }

    const fileReader = new FileReader();

    fileReader.onload = async (e) => {
      const fileText = e.target.result;
      const uploadData = await uploadRestaurants(fileText as string, accessToken);

      if (!uploadData.success) {
        setError(uploadData.message);
        event.target.value = null;
        return;
      }

      console.log('File uploaded successfully:', uploadData.message);
      event.target.value = null;
    };

    fileReader.onerror = (e) => {
      setError("File reading failed. Please try again.");
      event.target.value = null;
      return;
    };

    console.log('Selected file:', fileObj);

    fileReader.readAsText(fileObj);
  };

  const handleFetchRestaurants = async (coords: Coordinates) => {
    setLoading(true);
    try {
      const { restaurants: fetched } = await fetchRecommendedRestaurants(coords);

      const enriched = fetched.map(res => ({
        ...res,
        distance: calculateDistance(coords, { lat: res.lat, lng: res.lng })
      }));

      setRestaurants(enriched);
    } catch (err) {
      setError("Failed to fetch recommendations. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedRestaurants = useMemo(() => {
    let result = [...restaurants];

    // Fuzzy Keyword Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(res =>
        res.name.toLowerCase().includes(query) ||
        res.cuisine.toLowerCase().includes(query) ||
        res.description.toLowerCase().includes(query) ||
        res.address.toLowerCase().includes(query)
      );
    }

    // Sorting
    return result.sort((a, b) => {
      if (sortBy === SortOption.DISTANCE) return (a.distance || 0) - (b.distance || 0);
      if (sortBy === SortOption.RATING) return b.rating - a.rating;
      if (sortBy === SortOption.PRICE) return a.priceLevel.length - b.priceLevel.length;
      return 0;
    });
  }, [restaurants, sortBy, searchQuery]);

  const selectedRestaurant = useMemo(() =>
    restaurants.find(r => r.id === selectedId),
    [restaurants, selectedId]);

  const handleSignIn = (token: string) => {
    if (!token) {
      return;
    }

    setIsAdmin(true);
    setAccessToken(token);
    setCurrentView('discovery');
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setAccessToken('');
    setCurrentView('discovery');
  };

  // Conditional Rendering for Sign In Page
  if (currentView === 'signin') {
    return <SignIn onSignIn={handleSignIn} onBack={() => setCurrentView('discovery')} />;
  }

  return (
    <div className="flex flex-col h-screen max-h-screen bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 z-20 shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-amber-500 p-2 rounded-lg text-white">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 font-serif leading-none">Nom Nom</h1>
              {isAdmin && (
                <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 uppercase tracking-tighter border border-amber-200">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  Admin
                </span>
              )}
            </div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">The Cheesiest Local Guide</p>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-4 flex-1 max-w-xl mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cuisine, name, or keywords..."
              className="w-full pl-10 pr-10 py-2 bg-gray-100 rounded-full text-sm text-gray-900 border-none focus:ring-2 focus:ring-amber-500/20 transition-all outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center bg-gray-100 p-1 rounded-lg mr-2">
            <button
              onClick={() => setViewMode('split')}
              className={`p-1.5 rounded ${viewMode === 'split' ? 'bg-white shadow text-amber-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="Split View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-1.5 rounded ${viewMode === 'map' ? 'bg-white shadow text-amber-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="Map View"
            >
              <MapIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="h-8 w-[1px] bg-gray-200 hidden md:block mr-2" />

          {isAdmin ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          ) : (
            <button
              onClick={() => setCurrentView('signin')}
              className="flex items-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-600 px-4 py-2 rounded-full text-sm font-bold transition-all border border-amber-200"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Login</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-white z-50">
            <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
            <p className="text-gray-600 font-medium">Melting some cheese...</p>
            <p className="text-gray-400 text-sm mt-2">Fetching your perfect dining spots</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-white p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
            <p className="text-gray-500 max-w-md">{error}</p>
            <button
              onClick={() => {
                setError(null);
              }}
              className="mt-6 px-6 py-2 bg-amber-500 text-white rounded-full font-bold hover:bg-amber-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className={`flex flex-col border-r border-gray-200 transition-all duration-300 bg-white ${viewMode === 'map' ? 'w-0 opacity-0 overflow-hidden' : 'w-full md:w-[450px]'}`}>
              <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-700">Sort:</span>
                  <div className="flex gap-1 ml-1 overflow-x-auto no-scrollbar">
                    {Object.values(SortOption).map(option => (
                      <button
                        key={option}
                        onClick={() => setSortBy(option)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${sortBy === option ? 'bg-amber-100 text-amber-600' : 'text-gray-500 hover:bg-gray-100'}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter whitespace-nowrap ml-2">
                  {filteredAndSortedRestaurants.length} results
                </span>
              </div>

              {/* Mobile Search Bar (Visible only on small screens) */}
              <div className="p-4 lg:hidden border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search keywords..."
                    className="w-full pl-10 pr-10 py-2 bg-gray-100 rounded-full text-sm text-gray-900 border-none outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                    >
                      <X className="w-3 h-3 text-gray-400" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isAdmin && (
                  <div className="p-4 bg-amber-50 border-b border-amber-100">
                    <input
                      type="file"
                      ref={uploadFileRef}
                      onChange={handleUploadFileChange}
                      style={{ display: 'none' }}
                    />
                    <button onClick={handleUploadFile} className="w-full py-2 bg-white border-2 border-dashed border-amber-300 rounded-xl text-amber-600 text-xs font-bold hover:border-amber-500 transition-all flex items-center justify-center gap-2">
                      + Upload Maps List
                    </button>
                  </div>
                )}

                {filteredAndSortedRestaurants.length === 0 ? (
                  <div className="p-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Search className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-800">No results found</h3>
                    <p className="text-gray-500 text-sm mt-1 px-4">
                      We couldn't find any restaurants matching "{searchQuery}". Try a different keyword or check your spelling.
                    </p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-6 text-amber-600 font-bold text-sm hover:underline"
                    >
                      Clear search
                    </button>
                  </div>
                ) : (
                  filteredAndSortedRestaurants.map(res => (
                    <RestaurantCard
                      key={res.id}
                      restaurant={res}
                      isSelected={selectedId === res.id}
                      onClick={() => {
                        setSelectedId(res.id);
                        if (window.innerWidth < 768) setViewMode('map');
                      }}
                    />
                  ))
                )}

                <div className="p-8 text-center bg-gray-50">
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Handpicked for your palette</p>
                </div>
              </div>
            </div>

            <div className={`flex-1 relative transition-all duration-300 ${viewMode === 'list' ? 'hidden' : 'block'}`}>
              <MapView
                userLocation={userLocation!}
                restaurants={filteredAndSortedRestaurants}
                selectedId={selectedId}
                onRestaurantSelect={(id) => setSelectedId(id)}
              />

              <button
                onClick={() => setViewMode(viewMode === 'map' ? 'split' : 'map')}
                className="md:hidden absolute bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-2 font-bold text-sm active:scale-95 transition-transform"
              >
                {viewMode === 'map' ? <ListIcon className="w-4 h-4" /> : <MapIcon className="w-4 h-4" />}
                {viewMode === 'map' ? 'Show List' : 'Show Map'}
              </button>

              {selectedRestaurant && viewMode === 'map' && (
                <div className="absolute top-4 left-4 right-4 z-40 animate-in slide-in-from-top duration-300 md:hidden">
                  <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex h-24">
                    <img src={selectedRestaurant.imageUrl} className="w-24 h-24 object-cover" />
                    <div className="flex-1 p-3 min-w-0">
                      <h4 className="font-bold text-gray-900 truncate">{selectedRestaurant.name}</h4>
                      <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                        <Star className="w-3 h-3 fill-current" />
                        {selectedRestaurant.rating} • {selectedRestaurant.cuisine}
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1 truncate">{selectedRestaurant.address}</p>
                      <button
                        onClick={() => setViewMode('split')}
                        className="mt-1 text-[10px] font-bold text-amber-600 underline"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <footer className="h-8 bg-gray-900 text-white text-[9px] flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <span className="opacity-50 uppercase tracking-widest">LOCATION: {userLocation?.lat.toFixed(4)}, {userLocation?.lng.toFixed(4)}</span>
          <span className="opacity-50 uppercase tracking-widest">THEME: AGED CHEDDAR</span>
        </div>
        <div className="flex items-center gap-3">
          {!isAdmin && (
            <button
              onClick={() => setCurrentView('signin')}
              className="opacity-30 hover:opacity-100 transition-opacity uppercase tracking-widest font-black"
            >
              Admin Portal
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
            <span className="font-bold tracking-widest uppercase opacity-75">Ready to eat</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
