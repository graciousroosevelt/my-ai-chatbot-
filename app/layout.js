export const metadata = {
  title: "My AI Assistant",
  description: "Personal AI chatbot powered by Groq",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
    }
