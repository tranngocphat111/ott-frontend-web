import React from "react";
import { Plus } from "lucide-react";

const CreateStoryCardFooter: React.FC = () => (
  <div className="absolute bottom-0 left-0 right-0 bg-white flex flex-col items-center pt-5 pb-2">
    <div className="absolute -top-4 size-8 bg-primary-500 rounded-full flex items-center justify-center border-2 border-white shadow">
      <Plus className="size-4 text-white" />
    </div>
    <span className="text-xs font-semibold text-gray-800">Tạo tin</span>
  </div>
);

export default CreateStoryCardFooter;
