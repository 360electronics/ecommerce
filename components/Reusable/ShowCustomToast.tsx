import { toast } from 'react-hot-toast';

export const showFancyToast = ({
  title,
  message,
  type = 'info',
}: {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'error';
}) => {
  const styleMap = {
    info: 'backdrop-blur-md border-blue-400/50 text-blue-900/80 bg-white/80',
    success: 'backdrop-blur-md border-green-400/50 text-green-900/80 bg-white/80',
    error: 'backdrop-blur-md border-red-400/50 text-red-900/80 bg-white/80',
  };

  toast.custom(
    (t) => (
      <div
        className={`
          ${t.visible ? 'animate-enter' : 'animate-leave'}
          max-w-sm w-full border-l-4 ${styleMap[type]}
          shadow-xl rounded-xl pointer-events-auto p-4
          transition-all duration-300
        `}
      >
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <p className="text-base font-semibold">{title}</p>
            <p className="mt-1 text-sm leading-snug">{message}</p>
          </div>

          <button
            onClick={() => toast.dismiss(t.id)}
            className="text-sm font-bold text-gray-500 hover:text-black transition cursor-pointer"
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      </div>
    ),
    {
      duration: 1200,         
      position: 'top-center',   // optional
    }
  );
};
