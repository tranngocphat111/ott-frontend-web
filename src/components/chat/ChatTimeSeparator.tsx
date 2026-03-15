
export const ChatTimeSeparator = ({ time }: { time: string }) => {
  return (
    <div className="flex justify-center my-5">
      <span className="text-[11px] font-medium text-gray-600 bg-gray-200 px-3 py-1 rounded-full select-none shadow-sm whitespace-nowrap">
        {time}
      </span>
    </div>
  );
};
