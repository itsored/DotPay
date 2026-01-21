"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext"; // Adjust the path as needed
import Image from "next/image";
import { NexusLogo } from "@/constants/svg";
import { onboardingSource } from "@/helpers/onboardingSource";
// import { gsap } from "gsap";
// import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// gsap.registerPlugin(ScrollTrigger);

const Onboarding = () => {
  const router = useRouter();
  const { user } = useAuth() as unknown as { user: any }; // Or as { user: YourUserTypeHere };

  // useEffect(() => {
  //   // Check if the user is already logged in
  //   if (user) {
  //     // User is logged in, redirect to homepage
  //     router.replace("/home"); // Adjust this to your homepage route
  //   }
  //   // Else, stay on the onboarding page, allowing the user to navigate to login manually

  //   ScrollTrigger.create({
  //     trigger: "#animate",
  //     start: "right top",
  //     endTrigger: "#animate",
  //     end: "+=700",
  //     pin: true,
  //     horizontal: true,
  //   });
  // }, [router, user]); // Add `user` dependency to react to changes in authentication status

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
                    <div className="flex flex-col justify-center">
                      <Link
                        href="/login"
                        className="bg-white p-3 rounded-2xl mt-5 font-bold cursor-pointer text-center w-full sm:w-[400px]"
                      >
                        Login
                      </Link>
                      <Dialog>
                        <DialogTrigger asChild>
                          <button
                            className="bg-transparent border-2 border-white text-white p-3 rounded-2xl mt-5 font-bold cursor-pointer text-center w-full sm:w-[400px]"
                            type="submit"
                          >
                            Create a New Account
                          </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Choose DotPay Account Type</DialogTitle>
                          </DialogHeader>

                          <Link
                            href="/signup"
                            className=" border-2 border-black text-white bg-black p-3 rounded-2xl mt-5 font-bold cursor-pointer text-center w-full sm:w-[400px]"
                          >
                            Create Personal Account
                          </Link>
                          <Link
                            href="/signup/business"
                            className=" border-2 border-black text-black bg-transparent p-3 rounded-2xl font-bold cursor-pointer text-center w-full sm:w-[400px]"
                          >
                            Create Business Account
                          </Link>
                        </DialogContent>
                      </Dialog>
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
