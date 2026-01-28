"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { NexusLogo } from "@/constants/svg";
import { onboardingSource } from "@/helpers/onboardingSource";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { ThirdwebConnectButton } from "@/components/auth/ThirdwebConnectButton";
import { useAuthSession } from "@/context/AuthSessionContext";

const Onboarding = () => {
  const { isLoggedIn, loading } = useAuthSession();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isLoggedIn) {
      router.replace("/home");
    }
  }, [loading, isLoggedIn, router]);

  if (loading) {
    return (
      <main className="onboarding-bg flex items-center justify-center">
        <p className="text-white">Checking session...</p>
      </main>
    );
  }

  if (isLoggedIn) {
    return null;
  }

  return (
    <main className="onboarding-bg">
      <div className="flex justify-around w-full">
        <Image src={NexusLogo} alt="" className="py-[100px]" />
      </div>
      <div className="xsm:flex justify-center">
        <Carousel className="xsm:w-[400px]">
          <CarouselContent>
            {onboardingSource.map((element, index) => {
              return (
                <CarouselItem key={index}>
                  <div className="flex flex-col justify-around h-[400px]">
                    <h2 className="text-4xl text-white font-bold">
                      {element.title}
                    </h2>
                    <h4 className="text-white my-5">{element.subtitle}</h4>
                    <article className="flex">
                      <hr
                        className="line"
                        style={
                          index == 0 ? { width: "150px" } : { width: "50px" }
                        }
                      />
                      <hr
                        className="line"
                        style={
                          index == 1 ? { width: "150px" } : { width: "50px" }
                        }
                      />
                      <hr
                        className="line"
                        style={
                          index == 2 ? { width: "150px" } : { width: "50px" }
                        }
                      />
                    </article>
                    <div className="flex flex-col justify-center items-center mt-6">
                      <ThirdwebConnectButton mode="signup" />
                    </div>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>
      </div>
    </main>
  );
};

export default Onboarding;
