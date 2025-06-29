import ChatBot from "./components/ChatBot";
import RaiseTicketForm from "./components/RaiseTicketForm";

function App() {
  return (
    <div className="p-4 space-y-4">
      <RaiseTicketForm />
      <ChatBot />
    </div>
  );
}

export default App;
