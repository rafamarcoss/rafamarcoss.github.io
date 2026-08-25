"use client";;
/**
 * @author: @dorianbaffier
 * @description: Card Stack
 * @version: 1.1.0
 * @date: 2025-06-26
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 */

import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

const products = [
  {
    id: "crm-integration",
    title: "CRM Integration",
    subtitle: "Two-way sync",
    description:
      "Keep contacts, opportunities and deal stages in sync with the tools your sales team already uses.",
    image:
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80",
    specs: [
      { label: "Contacts", value: "Sync" },
      { label: "Stages", value: "Auto" },
      { label: "API", value: "REST" },
      { label: "Mode", value: "2-way" },
    ],
  },
  {
    id: "api-workflows",
    title: "API Workflows",
    subtitle: "Connect anything",
    description:
      "Trigger workflows from any webhook and orchestrate actions across your SaaS stack.",
    image:
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&auto=format&fit=crop&q=80",
    specs: [
      { label: "Webhooks", value: "Native" },
      { label: "Retries", value: "Bounded" },
      { label: "Logs", value: "Full" },
      { label: "Timeout", value: "Config" },
    ],
  },
  {
    id: "ai-agents",
    title: "AI Agents",
    subtitle: "Human handoff",
    description:
      "Agents that classify, draft and escalate, with a clean path back to a human reviewer.",
    image:
      "https://images.unsplash.com/photo-1629131726692-1accd0c53ce0?w=800&auto=format&fit=crop&q=80",
    specs: [
      { label: "Intent", value: "Classify" },
      { label: "Draft", value: "Grounded" },
      { label: "Handoff", value: "Always" },
      { label: "Guard", value: "Rules" },
    ],
  },
  {
    id: "analytics",
    title: "Analytics",
    subtitle: "See the flow",
    description:
      "A dashboard that shows runs, errors and bottlenecks. Descriptive capabilities, no fake metrics.",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80",
    specs: [
      { label: "Runs", value: "Traced" },
      { label: "Errors", value: "Grouped" },
      { label: "Export", value: "CSV" },
      { label: "Alert", value: "Channels" },
    ],
  },
];

const CARD_WIDTH = 320;
const CARD_OVERLAP = 240;

const Card = ({
  product,
  index,
  totalCards,
  isExpanded,
  reducedMotion
}) => {
  const centerOffset = (totalCards - 1) * 5;
  const defaultX = index * 10 - centerOffset;
  const defaultY = index * 2;
  const defaultRotate = index * 1.5;

  const totalExpandedWidth =
    CARD_WIDTH + (totalCards - 1) * (CARD_WIDTH - CARD_OVERLAP);
  const expandedCenterOffset = totalExpandedWidth / 2;

  const spreadX =
    index * (CARD_WIDTH - CARD_OVERLAP) - expandedCenterOffset + CARD_WIDTH / 2;
  const spreadRotate = index * 5 - (totalCards - 1) * 2.5;

  const collapsedPose = {
    x: defaultX,
    y: defaultY,
    rotate: reducedMotion ? 0 : defaultRotate,
    scale: 1,
  };

  const expandedPose = {
    x: spreadX,
    y: 0,
    rotate: reducedMotion ? 0 : spreadRotate,
    scale: 1,
  };

  const isSvg = product.image.endsWith(".svg");

  return (
    <motion.div
      animate={{
        ...(isExpanded ? expandedPose : collapsedPose),
        zIndex: totalCards - index,
      }}
      className={cn(
        "absolute inset-0 w-full rounded-2xl p-6",
        "bg-white/60 dark:bg-neutral-900/60",
        "border border-white/20 dark:border-neutral-800/40",
        "backdrop-blur-xl backdrop-saturate-150",
        "shadow-[0_8px_20px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_20px_rgb(0,0,0,0.3)]",
        "hover:border-white/30 dark:hover:border-neutral-700/30",
        "hover:shadow-[0_12px_40px_rgb(0,0,0,0.12)] dark:hover:shadow-[0_12px_40px_rgb(0,0,0,0.4)]",
        "transition-[border-color,box-shadow] duration-300 ease-out",
        "transform-gpu overflow-hidden"
      )}
      initial={collapsedPose}
      style={{
        maxWidth: `${CARD_WIDTH}px`,
        left: "50%",
        marginLeft: `-${CARD_WIDTH / 2}px`,
      }}
      transition={
        reducedMotion
          ? { duration: 0.2, ease: "easeOut" }
          : {
              type: "spring",
              stiffness: 220,
              damping: 28,
              mass: 1,
              delay: isExpanded ? index * 0.04 : 0,
            }
      }>
      <div className="relative z-10">
        <dl className="mb-4 grid grid-cols-4 justify-center gap-2">
          {product.specs.map((spec) => (
            <div
              className="flex flex-col items-start text-left text-[10px]"
              key={spec.label}>
              <dd className="w-full text-left font-medium text-gray-500 dark:text-gray-400">
                {spec.value}
              </dd>
              <dt className="mb-0.5 w-full text-left text-gray-900 dark:text-gray-100">
                {spec.label}
              </dt>
            </div>
          ))}
        </dl>

        <div
          className={cn(
            "relative aspect-[16/11] w-full overflow-hidden rounded-lg",
            "bg-neutral-100 dark:bg-neutral-900",
            "border border-neutral-200/50 dark:border-neutral-700/50",
            "shadow-inner"
          )}>
          <Image
            alt={product.description}
            className="object-cover"
            fill
            sizes="320px"
            src={product.image}
            unoptimized={isSvg} />
        </div>

        <div className="mt-4">
          <div className="space-y-1">
            <span
              className="block text-left font-bold text-3xl text-gray-900 tracking-tight dark:text-white">
              {product.title}
            </span>
            <span
              className="block text-left font-semibold text-3xl text-gray-500 tracking-tight dark:text-gray-400">
              {product.subtitle}
            </span>
          </div>
          <p className="mt-2 text-left text-gray-500 text-sm dark:text-gray-400">
            {product.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default function CardStackExample({
  className
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const reducedMotion = useReducedMotion() ?? false;

  const handleToggle = () => setIsExpanded((prev) => !prev);

  return (
    <button
      aria-expanded={isExpanded}
      aria-label={isExpanded ? "Collapse card stack" : "Expand card stack"}
      className={cn(
        "relative mx-auto cursor-pointer",
        "min-h-[440px] w-full max-w-[90vw]",
        "md:max-w-[1200px]",
        "appearance-none border-0 bg-transparent p-0",
        "mb-8 flex items-center justify-center",
        className
      )}
      onClick={handleToggle}
      type="button">
      {products.map((product, index) => (
        <Card
          index={index}
          isExpanded={isExpanded}
          key={product.id}
          product={product}
          reducedMotion={reducedMotion}
          totalCards={products.length} />
      ))}
    </button>
  );
}
