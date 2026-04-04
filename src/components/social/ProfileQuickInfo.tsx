import React from "react";
import { Briefcase, MapPin, Heart } from "lucide-react";

interface ProfileQuickInfoProps {
  work?: string;
  location?: string;
  relationship?: string;
}

const ProfileQuickInfo: React.FC<ProfileQuickInfoProps> = ({
  work,
  location,
  relationship,
}) => {
  if (!work && !location && !relationship) {
    return null;
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <div className="flex flex-wrap gap-4">
        {work && (
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Briefcase className="size-4 text-gray-400" />
            {work}
          </div>
        )}
        {location && (
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <MapPin className="size-4 text-gray-400" />
            {location}
          </div>
        )}
        {relationship && (
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Heart className="size-4 text-gray-400" />
            {relationship}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileQuickInfo;
