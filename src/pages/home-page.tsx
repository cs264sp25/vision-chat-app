import { Button } from "@/components/ui/button";
import { useRouter } from "@/hooks/use-router";
import { cn } from "@/lib/utils";
import { MicVocal, ScanEye } from "lucide-react";

const DEBUG = false;

const HomePage: React.FC = () => {
  const { navigate } = useRouter();

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center h-screen gap-5",
        {
          "border-2 border-red-500": DEBUG,
        },
      )}
    >
      <div
        className={cn(
          "flex items-center justify-start font-semibold text-xl3",
          {
            "border-2 border-blue-500": DEBUG,
          },
        )}
      >
        <ScanEye className="w-6 h-6 mr-2" />
        <span className="truncate">Vision Chat</span>
      </div>
      <div className="max-w-md">
        A simple ChatGPT-like application that allows you leverage image
        generation and image analysis capabilities of OpenAI's LLMs.
      </div>
      <Button onClick={() => navigate("chats")}>Get Started</Button>
    </div>
  );
};

export default HomePage;
