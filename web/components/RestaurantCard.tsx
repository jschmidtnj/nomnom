
import React from 'react';
import { Restaurant } from '../types';
import { formatDistance } from '../utils';
import { Star, MapPin, ExternalLink, Navigation } from 'lucide-react';

interface Props {
  restaurant: Restaurant;
  isSelected: boolean;
  onClick: () => void;
}

const RestaurantCard: React.FC<Props> = ({ restaurant, isSelected, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`group cursor-pointer p-4 transition-all duration-300 border-b border-gray-100 hover:bg-amber-50 ${isSelected ? 'bg-amber-50 border-l-4 border-l-amber-500' : 'bg-white'}`}
    >
      <div className="flex gap-4">
        <div className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden shadow-sm relative">
          <img 
            src={restaurant.imageUrl} 
            alt={restaurant.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute top-1 right-1 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-bold text-gray-700 shadow-sm">
            {restaurant.priceLevel}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-gray-900 truncate group-hover:text-amber-600 transition-colors">
              {restaurant.name}
            </h3>
            {restaurant.distance !== undefined && (
              <span className="text-xs font-medium text-gray-500 flex items-center gap-1 whitespace-nowrap">
                <Navigation className="w-3 h-3" />
                {formatDistance(restaurant.distance)}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1 mt-1 text-sm font-medium text-amber-500">
            <Star className="w-4 h-4 fill-current" />
            <span>{restaurant.rating.toFixed(1)}</span>
            <span className="text-gray-400 font-normal ml-1">• {restaurant.cuisine}</span>
          </div>

          <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
            {restaurant.description}
          </p>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center text-[11px] text-gray-400 gap-1 truncate">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{restaurant.address}</span>
            </div>
            
            {restaurant.mapsUrl && (
              <a 
                href={restaurant.mapsUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 text-gray-400 hover:text-amber-500 transition-colors"
                title="Open in Google Maps"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantCard;
