import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useTheme } from "next-themes";
import { useState, useEffect, createContext, ReactNode } from "react";
import { auth, db } from "../firebase-config";

// Define the ColorContext type to avoid TypeScript errors
interface ColorContextType {
  color: string | undefined;
  updateColors: (value: string) => Promise<void>;
}

interface ColorConfig {
  name: string;
  value: string;
  light: {
    background: string;
    foreground: string;
    card: string;
    'card-foreground': string;
    popover: string;
    'popover-foreground': string;
    primary: string;
    'primary-foreground': string;
    secondary: string;
    'secondary-foreground': string;
    muted: string;
    'muted-foreground': string;
    accent: string;
    'accent-foreground': string;
    destructive: string;
    'destructive-foreground': string;
    border: string;
    input: string;
    ring: string;
  };
  dark: {
    background: string;
    foreground: string;
    card: string;
    'card-foreground': string;
    popover: string;
    'popover-foreground': string;
    primary: string;
    'primary-foreground': string;
    secondary: string;
    'secondary-foreground': string;
    muted: string;
    'muted-foreground': string;
    accent: string;
    'accent-foreground': string;
    destructive: string;
    'destructive-foreground': string;
    border: string;
    input: string;
    ring: string;
  };
}

const colors: ColorConfig[] = [
  {
    name: "Default",
    value: "default",
    light: {
      background: "",
      foreground: "",
      card: "",
      'card-foreground': "",
      popover: "",
      'popover-foreground': "",
      primary: "",
      'primary-foreground': "",
      secondary: "",
      'secondary-foreground': "",
      muted: "",
      'muted-foreground': "",
      accent: "",
      'accent-foreground': "",
      destructive: "",
      'destructive-foreground': "",
      border: "",
      input: "",
      ring: ""
    },
    dark: {
      background: "",
      foreground: "",
      card: "",
      'card-foreground': "",
      popover: "",
      'popover-foreground': "",
      primary: "",
      'primary-foreground': "",
      secondary: "",
      'secondary-foreground': "",
      muted: "",
      'muted-foreground': "",
      accent: "",
      'accent-foreground': "",
      destructive: "",
      'destructive-foreground': "",
      border: "",
      input: "",
      ring: ""
    }
  },
  {
    name: "Blue",
    value: "blue",
    light: {
      background: "185 100% 100%",
      foreground: "185 5% 10%",
      card: "185 50% 100%",
      'card-foreground': "185 5% 15%",
      popover: "185 100% 100%",
      'popover-foreground': "185 100% 10%",
      primary: "212 100% 47%",
      'primary-foreground': "0 0% 100%",
      secondary: "185 30% 90%",
      'secondary-foreground': "0 0% 0%",
      muted: "212 30% 95%",
      'muted-foreground': "185 5% 40%",
      accent: "212 100% 47%",
      'accent-foreground': "185 5% 15%",
      destructive: "0 100% 50%",
      'destructive-foreground': "185 5% 100%",
      border: "185 30% 82%",
      input: "185 30% 50%",
      ring: "212 100% 47%"
    },
    dark: {
      background: "185 50% 10%",
      foreground: "185 5% 100%",
      card: "185 50% 10%",
      'card-foreground': "185 5% 100%",
      popover: "185 50% 5%",
      'popover-foreground': "185 5% 100%",
      primary: "212 100% 47%",
      'primary-foreground': "0 0% 100%",
      secondary: "185 30% 20%",
      'secondary-foreground': "0 0% 100%",
      muted: "212 30% 25%",
      'muted-foreground': "185 5% 65%",
      accent: "212 100% 47%",
      'accent-foreground': "185 5% 95%",
      destructive: "0 100% 50%",
      'destructive-foreground': "185 5% 100%",
      border: "185 30% 50%",
      input: "185 30% 50%",
      ring: "212 100% 47%"
    }
  },{
    name: "Green",
    value: "green",
    light: {
      background: "185 100% 100%",
      foreground: "185 5% 10%",
      card: "185 50% 100%",
      'card-foreground': "185 5% 15%",
      popover: "185 100% 100%",
      'popover-foreground': "185 100% 10%",
      primary: "142 76% 36%",
      'primary-foreground': "0 0% 100%",
      secondary: "185 30% 90%",
      'secondary-foreground': "0 0% 0%",
      muted: "142 30% 95%",
      'muted-foreground': "185 5% 40%",
      accent: "142 76% 36%",
      'accent-foreground': "185 5% 15%",
      destructive: "0 100% 50%",
      'destructive-foreground': "185 5% 100%",
      border: "185 30% 82%",
      input: "185 30% 50%",
      ring: "142 76% 36%"
    },
    dark: {
      background: "185 50% 10%",
      foreground: "185 5% 100%",
      card: "185 50% 10%",
      'card-foreground': "185 5% 100%",
      popover: "185 50% 5%",
      'popover-foreground': "185 5% 100%",
      primary: "142 76% 36%",
      'primary-foreground': "0 0% 100%",
      secondary: "185 30% 20%",
      'secondary-foreground': "0 0% 100%",
      muted: "142 30% 25%",
      'muted-foreground': "185 5% 65%",
      accent: "142 76% 36%",
      'accent-foreground': "185 5% 95%",
      destructive: "0 100% 50%",
      'destructive-foreground': "185 5% 100%",
      border: "185 30% 50%",
      input: "185 30% 50%",
      ring: "142 76% 36%"
    }
  },
  // Purple
  {
    name: "Purple",
    value: "purple",
    light: {
      background: "185 100% 100%",
      foreground: "185 5% 10%",
      card: "185 50% 100%",
      'card-foreground': "185 5% 15%",
      popover: "185 100% 100%",
      'popover-foreground': "185 100% 10%",
      primary: "272 51% 54%",
      'primary-foreground': "0 0% 100%",
      secondary: "185 30% 90%",
      'secondary-foreground': "0 0% 0%",
      muted: "272 30% 95%",
      'muted-foreground': "185 5% 40%",
      accent: "272 51% 54%",
      'accent-foreground': "185 5% 15%",
      destructive: "0 100% 50%",
      'destructive-foreground': "185 5% 100%",
      border: "185 30% 82%",
      input: "185 30% 50%",
      ring: "272 51% 54%"
    },
    dark: {
      background: "185 50% 10%",
      foreground: "185 5% 100%",
      card: "185 50% 10%",
      'card-foreground': "185 5% 100%",
      popover: "185 50% 5%",
      'popover-foreground': "185 5% 100%",
      primary: "272 51% 54%",
      'primary-foreground': "0 0% 100%",
      secondary: "185 30% 20%",
      'secondary-foreground': "0 0% 100%",
      muted: "272 30% 25%",
      'muted-foreground': "185 5% 65%",
      accent: "272 51% 54%",
      'accent-foreground': "185 5% 95%",
      destructive: "0 100% 50%",
      'destructive-foreground': "185 5% 100%",
      border: "185 30% 50%",
      input: "185 30% 50%",
      ring: "272 51% 54%"
    }
  },
  // Red
  {
    name: "Red", 
    value: "red",
    light: {
      background: "185 100% 100%",
      foreground: "185 5% 10%",
      card: "185 50% 100%",
      'card-foreground': "185 5% 15%",
      popover: "185 100% 100%",
      'popover-foreground': "185 100% 10%",
      primary: "346 84% 46%",
      'primary-foreground': "0 0% 100%",
      secondary: "185 30% 90%",
      'secondary-foreground': "0 0% 0%",
      muted: "346 30% 95%",
      'muted-foreground': "185 5% 40%",
      accent: "346 84% 46%",
      'accent-foreground': "185 5% 15%",
      destructive: "0 100% 50%",
      'destructive-foreground': "185 5% 100%",
      border: "185 30% 82%",
      input: "185 30% 50%",
      ring: "346 84% 46%"
    },
    dark: {
      background: "185 50% 10%",
      foreground: "185 5% 100%",
      card: "185 50% 10%",
      'card-foreground': "185 5% 100%",
      popover: "185 50% 5%",
      'popover-foreground': "185 5% 100%",
      primary: "346 84% 46%",
      'primary-foreground': "0 0% 100%",
      secondary: "185 30% 20%",
      'secondary-foreground': "0 0% 100%",
      muted: "346 30% 25%",
      'muted-foreground': "185 5% 65%",
      accent: "346 84% 46%",
      'accent-foreground': "185 5% 95%",
      destructive: "0 100% 50%",
      'destructive-foreground': "185 5% 100%",
      border: "185 30% 50%",
      input: "185 30% 50%",
      ring: "346 84% 46%"
    }
  }
];


// Create and export ColorContext
export const ColorContext = createContext<ColorContextType | undefined>(undefined);

export const ColorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [color, setColor] = useState("blue"); // Default color
  const { theme, setTheme } = useTheme();

  // Define applyColorTheme outside of useEffect to use it in other places
  const applyColorTheme = (colorValue: string) => {
    if (colorValue === 'default') {
      // Remove all custom CSS variables
      Object.keys(colors[1].light).forEach(key => {
        document.documentElement.style.removeProperty(`--${key}`);
      });
      return;
    }

    const selectedColor = colors.find((c) => c.value === colorValue);
    if (selectedColor) {
      const variables = theme === "dark" ? selectedColor.dark : selectedColor.light;
      Object.entries(variables).forEach(([key, value]) => {
        if (value) { // Only set property if value exists
          document.documentElement.style.setProperty(`--${key}`, value);
        }
      });
    }
  };

  useEffect(() => {
    const fetchUserColor = async (userId: string) => {
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const savedColor = userDoc.data().color;
        applyColorTheme(savedColor);
        setColor(savedColor);
        setTheme(userDoc.data().theme);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) fetchUserColor(user.uid);
    });

    return () => unsubscribe();
  }, [theme]);

  const updateColors = async (colorValue: string) => {
    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, { color: colorValue });
    }
    applyColorTheme(colorValue); // Apply color theme here as well
    setColor(colorValue);
  };

  return (
    <ColorContext.Provider value={{ color, updateColors }}>
      {children}
    </ColorContext.Provider>
  );
};