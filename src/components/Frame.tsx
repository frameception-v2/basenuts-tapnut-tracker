"use client";

import { useEffect, useCallback, useState } from "react";
import sdk, {
  AddFrame,
  SignIn as SignInCore,
  type Context,
} from "@farcaster/frame-sdk";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "~/components/ui/card";

import { config } from "~/components/providers/WagmiProvider";
import { truncateAddress } from "~/lib/truncateAddress";
import { base, optimism } from "wagmi/chains";
import { useSession } from "next-auth/react";
import { createStore } from "mipd";
import { Label } from "~/components/ui/label";
import { PROJECT_TITLE } from "~/lib/constants";

function ExampleCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome to the Frame Template</CardTitle>
        <CardDescription>
          This is an example card that you can customize or remove
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Label>Place content in a Card here.</Label>
      </CardContent>
    </Card>
  );
}

export default function Frame() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.FrameContext>();

  const [added, setAdded] = useState(false);

  const [addFrameResult, setAddFrameResult] = useState("");

  const addFrame = useCallback(async () => {
    try {
      await sdk.actions.addFrame();
    } catch (error) {
      if (error instanceof AddFrame.RejectedByUser) {
        setAddFrameResult(`Not added: ${error.message}`);
      }

      if (error instanceof AddFrame.InvalidDomainManifest) {
        setAddFrameResult(`Not added: ${error.message}`);
      }

      setAddFrameResult(`Error: ${error}`);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      const context = await sdk.context;
      if (!context) {
        return;
      }

      setContext(context);
      setAdded(context.client.added);

      // If frame isn't already added, prompt user to add it
      if (!context.client.added) {
        addFrame();
      }

      sdk.on("frameAdded", ({ notificationDetails }) => {
        setAdded(true);
      });

      sdk.on("frameAddRejected", ({ reason }) => {
        console.log("frameAddRejected", reason);
      });

      sdk.on("frameRemoved", () => {
        console.log("frameRemoved");
        setAdded(false);
      });

      sdk.on("notificationsEnabled", ({ notificationDetails }) => {
        console.log("notificationsEnabled", notificationDetails);
      });
      sdk.on("notificationsDisabled", () => {
        console.log("notificationsDisabled");
      });

      sdk.on("primaryButtonClicked", () => {
        console.log("primaryButtonClicked");
      });

      console.log("Calling ready");
      sdk.actions.ready({});

      // Set up a MIPD Store, and request Providers.
      const store = createStore();

      // Subscribe to the MIPD Store.
      store.subscribe((providerDetails) => {
        console.log("PROVIDER DETAILS", providerDetails);
        // => [EIP6963ProviderDetail, EIP6963ProviderDetail, ...]
      });
    };
    if (sdk && !isSDKLoaded) {
      console.log("Calling load");
      setIsSDKLoaded(true);
      load();
      return () => {
        sdk.removeAllListeners();
      };
    }
  }, [isSDKLoaded, addFrame]);

  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div
      style={{
        paddingTop: context?.client.safeAreaInsets?.top ?? 0,
        paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
        paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
        paddingRight: context?.client.safeAreaInsets?.right ?? 0,
      }}
    >
      <div className="w-[300px] mx-auto py-2 px-2">
        {/* Header */}
        <header className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-300">
            {PROJECT_TITLE}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Click the peanut to feed it!
          </p>
        </header>

        {/* Counter Display */}
        <div className="text-center mb-4">
          <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            0
          </span>
          <span className="text-gray-600 dark:text-gray-400 ml-2">peanuts fed</span>
        </div>

        {/* Peanut Button */}
        <div className="flex justify-center mb-6">
          <button 
            className="w-[72px] h-[72px] rounded-full bg-amber-200 hover:bg-amber-300 
                       transition-all duration-200 transform hover:scale-105 active:scale-95
                       flex items-center justify-center shadow-lg"
            aria-label="Feed peanut"
          >
            🥜
          </button>
        </div>

        {/* Input Container */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Your FID
          </label>
          <input 
            type="number"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                     rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="Enter your FID"
          />
        </div>
      </div>
    </div>
  );
}
