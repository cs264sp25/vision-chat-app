import { useEffect } from "react";
import Layout from "@/components/layout";
import { useTheme } from "@/hooks/use-theme";
import NotFoundPage from "@/pages/not-found-page";
import HomePage from "@/pages/home-page";
import ListChatsPage from "@/pages/chats/list-chats-page";
import EditChatPage from "@/pages/chats/edit-chat-page";
import AddChatPage from "@/pages/chats/add-chat-page";
import Empty from "@/components/empty";
import { useRouter } from "@/hooks/use-router";
import MessagesPage from "@/pages/messages/messages-page";

function App() {
  const { theme } = useTheme();
  const { currentRoute, params } = useRouter();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  if (!currentRoute) {
    return <NotFoundPage />;
  }

  if (currentRoute === "home") {
    return <HomePage />;
  }

  const renderContent = () => {
    switch (currentRoute) {
      case "chats":
        return {
          left: <ListChatsPage />,
          middle: <Empty message="Select a chat to view its messages." />,
          right: null,
        };
      case "addChat":
        return {
          left: <ListChatsPage />,
          middle: <AddChatPage />,
          right: null,
        };
      case "editChat":
        return {
          left: <ListChatsPage />,
          middle: <EditChatPage chatId={params.chatId as string} />,
          right: null,
        };
      case "messages":
        return {
          left: <ListChatsPage />,
          middle: <MessagesPage chatId={params.chatId as string} />,
          right: null,
        };

      default:
        return {
          left: <NotFoundPage />,
          middle: null,
          right: null,
        };
    }
  };

  const { left, middle, right } = renderContent();

  return (
    <Layout
      leftPanelContent={left}
      middlePanelContent={middle}
      rightPanelContent={right}
      className="h-screen"
    />
  );
}

export default App;
