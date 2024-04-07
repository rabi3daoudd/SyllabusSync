"use client";

import * as React from "react";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuLink,
  NavigationMenuTrigger,
} from "../../components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Button } from "../../components/ui/button";
import {
  AvatarImage,
  Avatar,
  AvatarFallback,
} from "../../components/ui/avatar";
import { cn } from "../../lib/utils";
import { Icons } from "../../components/ui/icons";
import { auth, db } from "../../firebase-config";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/router";

const components: { title: string; href: string; description: string }[] = [
  {
    title: "SyllabusSync AI",
    href: "/chat",
    description:
      "An AI chatbot that helps you find and sync your syllabus with your calendar.",
  },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleDrawer = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userInitial, setUserInitial] = useState<string | null>(null);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const router = useRouter();

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
          // Fetch additional details from Firestore for email/password sign-ups
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
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await auth.signOut();
    router.push("/login");
  };

  return (
    <>
      <div className="fixed top-0 left-1/2 overflow-hidden transform -translate-x-1/2 h-[10%] w-[90%] backdrop-filter backdrop-blur-3xl z-50"></div>
      <div className="fixed top-0 left-0 right-0 h-[30%] bg-gradient-to-b from-[#1FCAD9] opacity-50 to-transparent backdrop-blur-md z-0"></div>
      <div className="flex justify-center items-center">
        <nav
          key="1"
          className="fixed w-[95%] top-5 md:top-5 md:w-[90%] bg-white py-2 rounded-lg shadow mt-2 z-50"
        >
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center space-x-4">
              <img
                className="h-auto w-auto ml-6"
                src="/logo.png"
                alt="Your Logo"
                style={{ maxWidth: "80px", maxHeight: "80px" }}
              />
            </div>
            <div className="hidden flex-1 ml-10 mx-auto md:flex md:items-center md:justify-center">
              <NavigationMenu>
                <NavigationMenuList className="flex flex-col md:flex-row md:space-x-8 mt-4 md:mt-0">
                  {/* Home Link */}
                  <NavigationMenuItem asChild>
                    <Link
                      className="text-gray-800 hover:text-blue-500"
                      href="/"
                    >
                      Home
                    </Link>
                  </NavigationMenuItem>

                  {/* Classes Link */}
                  <NavigationMenuItem asChild>
                    <Link
                      className="text-gray-800 hover:text-blue-500"
                      href="/classes"
                    >
                      Classes
                    </Link>
                  </NavigationMenuItem>

                  {/* Tasks Link */}
                  <NavigationMenuItem asChild>
                    <Link
                      className="text-gray-800 hover:text-blue-500"
                      href="/tasks"
                    >
                      Tasks
                    </Link>
                  </NavigationMenuItem>

                  {/* Tools - If you need a dropdown like the Select component, you might need to implement a custom solution or adapt the NavigationMenu to handle dropdown logic */}
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="text-gray-800 hover:text-blue-500">
                      Tools
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                        {components.map((component) => (
                          <ListItem
                            key={component.title}
                            title={component.title}
                            href={component.href}
                          >
                            {component.description}
                          </ListItem>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </div>
            <div className="flex items-center space-x-4 mr-6">
              <Button className="hidden md:inline-block bg-[#1FCAD9] text-white">
                + NEW
              </Button>
              <Icons.Bell className="w-7 h-11 left-0 ml-[-10%]" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={userAvatarUrl ?? ""} alt="@shadcn" />
                      <AvatarFallback>{userInitial}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {userName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {userEmail}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <Link href="/settings">
                      <DropdownMenuItem>Settings</DropdownMenuItem>
                    </Link>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="w-full hover:[]"
                  >
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <button
                className="mr-10 md:hidden"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? (
                  <Icons.XIcon className="h-10 w-10" />
                ) : (
                  <Icons.Hamburger className="h-10 w-10" />
                )}
              </button>
              <div
                className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
                  isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                }
                isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
                onClick={toggleDrawer}
              />

              {/* Side Drawer */}
              <div
                className={`fixed -ml-4 top-0 left-[-16px] w-[80%] bg-white h-full overflow-auto transition-transform duration-300 z-50 ${
                  isMenuOpen ? "translate-x-0" : "-translate-x-full"
                }
                isMenuOpen ? "translate-x-0" : "-translate-x-full"
              }`}
              >
                <button onClick={toggleDrawer} className="p-4">
                  <Icons.XIcon className="h-6 w-6" />
                </button>
                <nav className="flex flex-col items-start p-4">
                  <Link
                    className="text-gray-800 hover:text-blue-500 py-2"
                    href="/"
                  >
                    Home
                  </Link>
                  <Link
                    className="text-gray-800 hover:text-blue-500 py-2"
                    href="/classes"
                  >
                    Classes
                  </Link>
                  <Link
                    className="text-gray-800 hover:[#1FCAD9] py-2"
                    href="/tasks"
                  >
                    Tasks
                  </Link>
                  {/* Include other links or content */}
                </nav>
              </div>
            </div>

            {isMenuOpen && (
              <div className="md:hidden">
                <div className="px-2 pt-2 pb-3 space-y-1"></div>
              </div>
            )}
          </div>
        </nav>
      </div>
    </>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";
