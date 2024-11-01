import { useEffect } from "react";
import { RadioGroup } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { auth, db } from "../../../firebase-config";
import { doc, updateDoc } from "firebase/firestore";
import {
  CardTitle,
  CardDescription,
  CardHeader,
  CardContent,
  Card,
} from '@/components/ui/card';

interface AppearanceSettingsProps {
  accentColor: string;
  handleColorChange: (value: string) => Promise<void>;
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

interface AppearanceSettingsProps {
  accentColor: string;
  handleColorChange: (value: string) => Promise<void>;
}

const colors: ColorConfig[] = [
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

const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({ 
  accentColor, 
  handleColorChange 
}) => {
  const { theme } = useTheme();
  
  const updateColors = async (value: string) => {
    const selectedColor = colors.find(c => c.value === value);
    if (selectedColor) {
      const variables = theme === 'dark' ? selectedColor.dark : selectedColor.light;
      
      // Update all CSS variables for the accent color
      Object.entries(variables).forEach(([key, value]) => {
        document.documentElement.style.setProperty(`--${key}`, value);
      });

      // Update color in Firebase for the current user
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, { color: value });
      }
      
      await handleColorChange(value);
    }
  };

  // Update colors only when accentColor changes
  useEffect(() => {
    if (accentColor) {
      updateColors(accentColor);
    }
  }, [accentColor]);

  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Customize the look and feel of the application.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label>Accent Color</Label>
            <RadioGroup
              defaultValue={accentColor}
              onValueChange={updateColors}
              className="grid grid-cols-4 gap-4 mt-2"
            >
              {colors.map((color) => (
                <Label
                  key={color.value}
                  className={cn(
                    "cursor-pointer flex items-center space-x-2 rounded-md border-2 border-muted bg-popover p-4",
                    accentColor === color.value && "border-primary"
                  )}
                >
                  <input
                    type="radio"
                    value={color.value}
                    checked={accentColor === color.value}
                    onChange={() => updateColors(color.value)}
                    className="sr-only"
                  />
                  <span
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: `hsl(${theme === 'dark' ? color.dark.primary : color.light.primary})` }}
                  />
                  <span>{color.name}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AppearanceSettings;