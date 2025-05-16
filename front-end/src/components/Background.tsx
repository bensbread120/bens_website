const Background = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Background Image (Fixed) */}
      <div
        className="fixed inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: "url('/images/landscape.jpg')" }}
      >
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default Background;
