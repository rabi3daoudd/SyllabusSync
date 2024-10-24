import { useEffect, useState } from "react";
import {
  Bell,
  BookOpen,
  ChevronRight,
  ChevronsUpDown,
  Home,
  LogOut,
  Send,
  Settings2,
  Sparkles,
  Wrench,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import { auth, db } from "../../firebase-config";
import { doc, getDoc } from "firebase/firestore";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

const data = {
  navMain: [
    {
      title: "Home",
      url: "/",
      icon: Home,
    },
    {
      title: "Classes",
      url: "/classes",
      icon: BookOpen,
    },
    {
      title: "Tasks",
      url: "/tasks",
      icon: ChevronRight,
    },
  ],
  tools: [
    { title: "Calculator", url: "#" },
    { title: "Notepad", url: "#" },
    { title: "Calendar", url: "#" },
    { title: "File Manager", url: "#" },
  ],
  navSecondary: [
    {
      title: "Raise a Bug",
      url: "#",
      icon: Send,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ],
};

function BugReportDialog() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [severity, setSeverity] = useState<string>("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const form = event.target as HTMLFormElement;
    const title = (form.elements.namedItem("title") as HTMLInputElement)?.value;
    const description = (
      form.elements.namedItem("description") as HTMLTextAreaElement
    )?.value;

    if (!title || !severity || !description) {
      alert("Please fill in all fields");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await axios.post(
        "https://api.github.com/repos/rabi3daoudd/SyllabusSync/issues",
        {
          title: `[${severity.toUpperCase()}] ${title}`,
          body: description,
          labels: ["bug", severity],
        },
        {
          headers: {
            Authorization: `token ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 201) {
        alert("Bug report submitted successfully!");
        setIsOpen(false);
        form.reset();
        setSeverity("");
      } else {
        throw new Error("Failed to create GitHub issue");
      }
    } catch (error) {
      console.error("Error creating GitHub issue:", error);
      alert("Failed to submit bug report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <SidebarMenuButton onClick={() => setIsOpen(true)} size="sm">
          <span>Raise a Bug</span>
        </SidebarMenuButton>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report a Bug</DialogTitle>
          <DialogDescription>
            Fill out the form below to create a new GitHub issue for this bug.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input id="title" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="severity" className="text-right">
                Severity
              </Label>
              <Select value={severity} onValueChange={setSeverity} required>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea id="description" className="col-span-3" required />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Bug Report"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type SidebarNavigationProps = {
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

export function SidebarNavigation({ children }: SidebarNavigationProps){
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userInitial, setUserInitial] = useState<string | null>(null);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserEmail(user.email);
        setUserName(user.displayName || "");

        if (user.displayName) {
          const names = user.displayName.split(" ");
          const initials = names.map((name) => name[0].toUpperCase());
          setUserInitial(initials.join(""));
        }

        if (!user.displayName) {
          const userRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const fullName =
              userData.firstName && userData.lastName
                ? `${userData.firstName} ${userData.lastName}`
                : "";
            setUserName(fullName);
            setUserAvatarUrl(userData.avatarUrl || null);
          }
        }
      } else {
        setUserEmail(null);
        setUserName(null);
        setUserAvatarUrl(null);
        setUserInitial(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await auth.signOut();
    router.push("/login");
  };

  return (
      <SidebarProvider>
        <Sidebar variant="floating">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild>
                  <a href="#">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                      <img
                        src="/logo.png"
                        alt="SyllabusSync Logo"
                        className="w-10 h-10"
                      />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        SyllabusSync
                      </span>
                      <span className="truncate text-xs">Pro</span>
                    </div>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu className="mt-4">
              {data.navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={pathname === item.url}
                  >
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <Wrench />
                      <span>Tools</span>
                      <ChevronRight className="ml-auto h-4 w-4" />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  {data.tools.map((tool) => (
                    <SidebarMenuItem key={tool.title}>
                      <SidebarMenuButton asChild className="pl-8">
                        <a href={tool.url}>{tool.title}</a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            </SidebarMenu>
            <SidebarMenu className="mt-auto">
              <SidebarMenuItem>
                <BugReportDialog />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild size="sm">
                  <a href={data.navSecondary[1].url}>
                    <span>{data.navSecondary[1].title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      size="lg"
                      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    >
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage
                          src={userAvatarUrl ?? ""}
                          alt={userName ?? ""}
                        />
                        <AvatarFallback className="rounded-lg">
                          {userInitial}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">
                          {userName}
                        </span>
                        <span className="truncate text-xs">{userEmail}</span>
                      </div>
                      <ChevronsUpDown className="ml-auto size-4" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                    side="bottom"
                    align="end"
                    sideOffset={4}
                  >
                    <DropdownMenuLabel className="p-0 font-normal">
                      <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                        <Avatar className="h-8 w-8 rounded-lg">
                          <AvatarImage
                            src={userAvatarUrl ?? ""}
                            alt={userName ?? ""}
                          />
                          <AvatarFallback className="rounded-lg">
                            {userInitial}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate font-semibold">
                            {userName}
                          </span>
                          <span className="truncate text-xs">{userEmail}</span>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Upgrade to Pro
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem>
                        <Bell className="mr-2 h-4 w-4" />
                        Notifications
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Link href="/settings" className="flex items-center">
                          <Settings2 className="mr-2 h-4 w-4" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-16 sticky top-0 shrink-0 items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
          </header>
          <main className="flex-grow overflow-auto">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
  );
}
