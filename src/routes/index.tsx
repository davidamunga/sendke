import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CheckIcon,
  GithubIcon,
  LockIcon,
  QrCodeIcon,
  InfoIcon,
  PrinterIcon,
  Share2Icon,
} from "lucide-react";
import { motion } from "motion/react";
import { ColorPicker } from "@/components/ui/color-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Card, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DEFAULT_POSTER_SIZE, POSTER_SIZES, BUSINESS_NAME_MAX_LENGTH } from "@/data/poster-sizes";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { PaymentForm, PaymentType } from "@/types/PaymentForm";
import { FORM_DEFAULT_VALUES, formSchema } from "@/schemas/form";
import { PosterPreview } from "@/components/poster-preview";
import { usePosterImage } from "@/hooks/use-poster-image";
import {
  ACCOUNT_NUMBER_MAX_LENGTH,
  formatAccountNumber,
  formatBusinessNumber,
  formatPhoneNumber,
} from "@/lib/helpers";

export const Route = createFileRoute("/")({
  component: Home,
});

interface HomeProps {
  formDefaults?: Partial<PaymentForm>;
}

export function Home({ formDefaults }: HomeProps = {}) {
  const [selectedSize, setSelectedSize] = useState(DEFAULT_POSTER_SIZE);
  const [exporting, setExporting] = useState<
    "download" | "share" | "print" | null
  >(null);

  const mergedDefaults = { ...FORM_DEFAULT_VALUES, ...formDefaults };

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
  } = useForm<PaymentForm>({
    resolver: zodResolver(formSchema),
    defaultValues: mergedDefaults,
    mode: "onChange",
  });

  const {
    paymentType,
    phoneNumber,
    paybillNumber,
    accountNumber,
    tillNumber,
    name,
    businessName,
    selectedColor,
    showName,
    showQrCode,
    title,
    fontScale = 1.0,
  } = useWatch({
    control,
    defaultValue: mergedDefaults,
  });

  const colorOptions = [
    { name: "Green", value: "#16a34a", class: "bg-green-600" },
    { name: "Rose", value: "#be123c", class: "bg-rose-700" },
    { name: "Yellow", value: "#F7C50C", class: "bg-[#F7C50C]" },
    { name: "Blue", value: "#1B398E", class: "bg-blue-800" },
  ];

  // Get current display values based on payment type
  const getCurrentDisplayValues = () => {
    switch (paymentType) {
      case "SEND_MONEY":
        return {
          primaryValue: phoneNumber || "0712 345 678",
          secondaryValue: name || "JOHN DOE",
          qrData: `SM|${(phoneNumber || "0712345678").replace(/\s/g, "")}`,
        };
      case "POCHI_LA_BIASHARA":
        return {
          primaryValue: phoneNumber || "0712 345 678",
          secondaryValue: name || "JOHN DOE",
          qrData: `SM|${(phoneNumber || "0712345678").replace(/\s/g, "")}`,
        };
      case "PAYBILL":
        return {
          primaryValue: formatBusinessNumber(paybillNumber || "123456"),
          secondaryValue: formatAccountNumber(accountNumber || "123456"),
          qrData: `PB|${(paybillNumber || "123456").replace(/\s/g, "")}|${(accountNumber || "123456").replace(/\s/g, "")}`,
        };
      case "TILL_NUMBER":
        return {
          primaryValue: formatBusinessNumber(tillNumber || "123456"),
          secondaryValue: "",
          qrData: `BG|${(tillNumber || "123456").replace(/\s/g, "")}`,
        };
      default:
        return {
          primaryValue: phoneNumber || "0712 345 678",
          secondaryValue: name || "JOHN DOE",
          qrData: `SM|${(phoneNumber || "0712345678").replace(/\s/g, "")}`,
        };
    }
  };

  const displayValues = getCurrentDisplayValues();

  const poster = usePosterImage({
    selectedSize,
    selectedColor: selectedColor || "#16a34a",
    paymentType: paymentType || "SEND_MONEY",
    showName: showName || false,
    showQrCode: showQrCode || false,
    title: title || "SEND MONEY",
    fontScale: fontScale || 1.0,
    businessName: businessName || "",
    displayValues,
  });

  const onSubmit = handleSubmit(async () => {
    await handleDownload();
  });

  const withExport = async (
    action: "download" | "share" | "print",
    run: () => Promise<unknown>
  ) => {
    if (exporting) return;
    setExporting(action);
    try {
      await run();
    } catch (error) {
      console.error(`Error while trying to ${action} poster:`, error);
    } finally {
      setExporting(null);
    }
  };

  const handleDownload = () => withExport("download", poster.download);
  const handleShare = () => withExport("share", poster.share);
  const handlePrint = () => withExport("print", poster.print);

  const getPaymentTypeText = () => {
    switch (paymentType) {
      case "SEND_MONEY":
        return "Phone Number";
      case "POCHI_LA_BIASHARA":
        return "Phone Number";
      case "PAYBILL":
        return "Paybill";
      case "TILL_NUMBER":
        return "Till Number";
      default:
        return "Phone Number";
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-gray-100">
      {/* Mobile Header - visible only on mobile */}
      <header className="w-full py-2 px-4 sm:px-6 lg:px-8 bg-white shadow-sm md:hidden relative z-10">
        <div className="max-w-7xl mx-auto flex-col justify-center flex items-center">
          <h1 className="text-2xl font-display sm:text-3xl font-bold text-green-600">
            send.ke
          </h1>
          <h3 className="text-md font-display text-gray-800 mt-2 max-w-md">
            Your {getPaymentTypeText()} 🤝 Payment Poster
          </h3>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row md:min-h-0 md:overflow-hidden px-4 py-3 md:py-3 sm:px-6 lg:px-8 gap-4 md:gap-4 relative z-10">
        {/* Left Column - App Info */}
        <div className="w-full md:w-1/2 flex flex-col justify-start md:h-full md:min-h-0 lg:px-4">
          {/* Header for medium screens and up - now in left column */}
          <div className="hidden md:flex md:items-end md:justify-between md:gap-4 mb-3">
            <div>
              <h1 className="text-3xl font-display font-bold text-green-600 leading-none">
                send.ke
              </h1>
              <h2 className="text-base font-display text-gray-800 mt-1">
                Your {getPaymentTypeText()} 🤝 Payment Poster
              </h2>
            </div>

            <div className="flex flex-row gap-2 shrink-0">
              <div className="bg-white rounded-md px-2 py-1 flex items-center border border-green-100">
                <CheckIcon className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-xs text-gray-700">100% Free</span>
              </div>
              <div className="bg-white rounded-md px-2 py-1 flex items-center border border-blue-100">
                <LockIcon className="w-4 h-4 text-blue-600 mr-1" />
                <span className="text-xs text-gray-700">Works Offline</span>
              </div>
              <a
                href="https://github.com/DavidAmunga/sendke"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-md px-2 py-1 flex items-center border border-gray-200 hover:border-gray-400"
              >
                <GithubIcon className="w-4 h-4 text-gray-600 mr-1" />
                <span className="text-xs text-gray-700">Open Source</span>
              </a>
            </div>
          </div>

          {/* App features — mobile only; desktop chips sit in the header */}
          <div className="flex flex-row gap-2 mb-4 md:hidden">
            <div className="bg-white rounded-lg shadow-sm px-3 py-2 flex items-center border border-green-100">
              <CheckIcon className="w-5 h-5 text-green-600 mr-1" />
              <span className="text-sm text-gray-700">100% Free</span>
            </div>
            <div className="bg-white rounded-lg shadow-sm px-3 py-2 flex items-center border border-blue-100">
              <LockIcon className="w-5 h-5 text-blue-600 mr-1" />
              <span className="text-sm text-gray-700">Works Offline</span>
            </div>
            <a
              href="https://github.com/DavidAmunga/sendke"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-lg shadow-sm px-3 py-2 flex items-center border border-gray-200"
            >
              <GithubIcon className="w-5 h-5 text-gray-600 mr-1" />
              <span className="text-sm text-gray-700">Open Source</span>
            </a>
          </div>

          <Card className="gap-3 py-4 md:gap-2 md:py-3 md:flex-1 md:min-h-0">
            <CardTitle className="px-4 md:hidden text-lg font-bold text-gray-900">
              Make Your Payment Poster
            </CardTitle>

            <CardContent className="px-4 md:px-5 flex flex-col flex-1 min-h-0">
              <div className="flex-1 min-h-0 md:overflow-y-auto">
              <Controller
                name="paymentType"
                control={control}
                render={({ field }) => (
                  <Tabs
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value as PaymentType);
                      setValue(
                        "title",
                        value.replaceAll(" ", "").replaceAll("_", " ")
                      );
                      setValue("showQrCode", value !== "PAYBILL");
                    }}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-4 mb-3">
                      <TabsTrigger
                        value="SEND_MONEY"
                        className="text-xs sm:text-sm"
                      >
                        Send Money
                      </TabsTrigger>
                      <TabsTrigger
                        value="PAYBILL"
                        className="text-xs sm:text-sm"
                      >
                        Paybill
                      </TabsTrigger>
                      <TabsTrigger
                        value="TILL_NUMBER"
                        className="text-xs sm:text-sm"
                      >
                        Till Number
                      </TabsTrigger>
                      <TabsTrigger
                        value="POCHI_LA_BIASHARA"
                        className="text-xs sm:text-sm"
                      >
                          Pochi
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="POCHI_LA_BIASHARA" className="space-y-3">
                      <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
                        <div>
                          <label
                            htmlFor="title"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Title Text
                          </label>
                          <Controller
                            name="title"
                            control={control}
                            render={({ field }) => (
                              <Input
                                id="title"
                                autoComplete="off"
                                type="text"
                                value={field.value}
                                onChange={field.onChange}
                                className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none text-base font-semibold"
                                placeholder="SEND MONEY"
                              />
                            )}
                          />
                          {errors.title && (
                            <p className="mt-1 text-sm text-red-500">
                              {errors.title.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="phone"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Phone Number
                          </label>
                          <Controller
                            name="phoneNumber"
                            control={control}
                            render={({ field }) => (
                              <Input
                                id="phone"
                                type="text"
                                autoComplete="off"
                                value={field.value || ""}
                                onChange={(e) => {
                                  const value = e.target.value.replace(
                                    /\D/g,
                                    ""
                                  );
                                  if (value.length <= 10) {
                                    field.onChange(formatPhoneNumber(value));
                                  }
                                }}
                                className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none text-base font-semibold"
                                placeholder="0712 345 678"
                              />
                            )}
                          />
                          {errors.phoneNumber && (
                            <p className="mt-1 text-sm text-red-500">
                              {errors.phoneNumber.message}
                            </p>
                          )}
                        </div>
                      </form>
                    </TabsContent>

                    <TabsContent value="SEND_MONEY" className="space-y-3">
                      <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
                        <div>
                          <label
                            htmlFor="title"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Title Text
                          </label>
                          <Controller
                            name="title"
                            control={control}
                            render={({ field }) => (
                              <Input
                                id="title"
                                autoComplete="off"
                                type="text"
                                value={field.value}
                                onChange={field.onChange}
                                className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none text-base font-semibold"
                                placeholder="SEND MONEY"
                              />
                            )}
                          />
                          {errors.title && (
                            <p className="mt-1 text-sm text-red-500">
                              {errors.title.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="phone"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Phone Number
                          </label>
                          <Controller
                            name="phoneNumber"
                            control={control}
                            render={({ field }) => (
                              <Input
                                id="phone"
                                type="text"
                                autoComplete="off"
                                value={field.value || ""}
                                onChange={(e) => {
                                  const value = e.target.value.replace(
                                    /\D/g,
                                    ""
                                  );
                                  if (value.length <= 10) {
                                    field.onChange(formatPhoneNumber(value));
                                  }
                                }}
                                className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none text-base font-semibold"
                                placeholder="0712 345 678"
                              />
                            )}
                          />
                          {errors.phoneNumber && (
                            <p className="mt-1 text-sm text-red-500">
                              {errors.phoneNumber.message}
                            </p>
                          )}
                        </div>
                      </form>
                    </TabsContent>

                    <TabsContent value="PAYBILL" className="space-y-3">
                      <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
                        <div className="md:col-span-2">
                          <label
                            htmlFor="title"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Title Text
                          </label>
                          <Controller
                            name="title"
                            control={control}
                            render={({ field }) => (
                              <Input
                                id="title"
                                type="text"
                                autoComplete="off"
                                value={field.value}
                                onChange={field.onChange}
                                className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none text-base font-semibold"
                                placeholder="SEND MONEY"
                              />
                            )}
                          />
                          {errors.title && (
                            <p className="mt-1 text-sm text-red-500">
                              {errors.title.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="paybill"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Paybill Number
                          </label>
                          <Controller
                            name="paybillNumber"
                            control={control}
                            render={({ field }) => (
                              <Input
                                id="paybill"
                                type="text"
                                autoComplete="off"
                                value={field.value || ""}
                                onChange={(e) => {
                                  const value = e.target.value.replace(
                                    /\D/g,
                                    ""
                                  );
                                  if (value.length <= 10) {
                                    field.onChange(formatBusinessNumber(value));
                                  }
                                }}
                                className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none text-base font-semibold"
                                placeholder="123 456"
                              />
                            )}
                          />
                          {errors.paybillNumber && (
                            <p className="mt-1 text-sm text-red-500">
                              {errors.paybillNumber.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="account"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Account Number
                          </label>
                          <Controller
                            name="accountNumber"
                            control={control}
                            render={({ field }) => (
                              <Input
                                id="account"
                                type="text"
                                value={field.value || ""}
                                onChange={(e) => {
                                  const cleaned = e.target.value.replace(
                                    /[^a-zA-Z0-9]/g,
                                    ""
                                  );
                                  if (
                                    cleaned.length <= ACCOUNT_NUMBER_MAX_LENGTH
                                  ) {
                                    field.onChange(
                                      formatAccountNumber(e.target.value)
                                    );
                                  }
                                }}
                                autoComplete="off"
                                inputMode="text"
                                autoCapitalize="characters"
                                className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none text-base font-semibold"
                                placeholder="SHOP 01"
                              />
                            )}
                          />
                          {errors.accountNumber && (
                            <p className="mt-1 text-sm text-red-500">
                              {errors.accountNumber.message}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-gray-500">
                            Letters and numbers are allowed
                          </p>
                        </div>
                      </form>
                    </TabsContent>

                    <TabsContent value="TILL_NUMBER" className="space-y-3">
                      <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
                        <div>
                          <label
                            htmlFor="title"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Title Text
                          </label>
                          <Controller
                            name="title"
                            control={control}
                            render={({ field }) => (
                              <Input
                                id="title"
                                type="text"
                                value={field.value}
                                onChange={field.onChange}
                                className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none text-base font-semibold"
                                placeholder="SEND MONEY"
                              />
                            )}
                          />
                          {errors.title && (
                            <p className="mt-1 text-sm text-red-500">
                              {errors.title.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="till"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Till Number
                          </label>
                          <Controller
                            name="tillNumber"
                            control={control}
                            render={({ field }) => (
                              <Input
                                id="till"
                                type="text"
                                value={field.value || ""}
                                onChange={(e) => {
                                  const value = e.target.value.replace(
                                    /\D/g,
                                    ""
                                  );
                                  if (value.length <= 10) {
                                    field.onChange(formatBusinessNumber(value));
                                  }
                                }}
                                className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none text-base font-semibold"
                                placeholder="123 456"
                              />
                            )}
                          />
                          {errors.tillNumber && (
                            <p className="mt-1 text-sm text-red-500">
                              {errors.tillNumber.message}
                            </p>
                          )}
                        </div>
                      </form>
                    </TabsContent>
                  </Tabs>
                )}
              />

              {/* Common Options Outside Tabs */}
              <div className="space-y-3 mt-4">
                <div>
                  <div className="flex items-center gap-3">
                    <label className="shrink-0 text-sm font-medium text-gray-700">
                      Font Size: {Math.round(fontScale * 100)}%
                    </label>
                    <Controller
                      name="fontScale"
                      control={control}
                      render={({ field }) => (
                        <Slider
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                          min={0.7}
                          max={1.8}
                          step={0.1}
                          className="w-full"
                        />
                      )}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1 md:hidden">
                    <span>70%</span>
                    <span>100%</span>
                    <span>180%</span>
                  </div>
                </div>
                {["SEND_MONEY", "POCHI_LA_BIASHARA"].includes(paymentType!) && (
                  <div className="flex items-center space-x-2 mb-2">
                    <Controller
                      name="showName"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="showName"
                          checked={field.value}
                          onCheckedChange={(checked: boolean) => {
                            field.onChange(checked);
                          }}
                        />
                      )}
                    />
                    <label
                      htmlFor="showName"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Show Name Field
                    </label>
                  </div>
                )}

                {["SEND_MONEY", "POCHI_LA_BIASHARA"].includes(paymentType!) && showName && (
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Your Name
                    </label>
                    <Controller
                      name="name"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="name"
                          type="text"
                          value={field.value || ""}
                          onChange={(e) => {
                            field.onChange(e.target.value.toUpperCase());
                          }}
                          className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none text-base font-semibold"
                          placeholder="JOHN DOE"
                        />
                      )}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="businessName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Shop or business name
                    <span className="font-normal text-gray-500"> Optional</span>
                  </label>
                  <Controller
                    name="businessName"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="businessName"
                        type="text"
                        value={field.value || ""}
                        onChange={(e) => {
                          const next = e.target.value.toUpperCase();
                          if (next.length <= BUSINESS_NAME_MAX_LENGTH) {
                            field.onChange(next);
                          }
                        }}
                        autoComplete="off"
                        className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none text-base font-semibold"
                        placeholder="MAMA MBOGA"
                      />
                    )}
                  />
                  {errors.businessName && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.businessName.message}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 md:hidden">
                    Shown as a small label at the bottom of the poster
                  </p>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                {paymentType !== "PAYBILL" && (
                  <div className="flex items-center space-x-2">
                    <Controller
                      name="showQrCode"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="showQrCode"
                          checked={field.value}
                          onCheckedChange={(checked: boolean) => {
                            field.onChange(checked);
                          }}
                        />
                      )}
                    />
                    <label
                      htmlFor="showQrCode"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
                    >
                      <QrCodeIcon className="h-4 w-4 mr-1 text-gray-600" />
                      Show M-PESA QR Code
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <InfoIcon className="h-3 w-3 ml-1 text-gray-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>
                              When scanned with M-PESA app, this QR code will
                              pre-fill your phone number in the payment screen.
                              Format: SM|phonenumber
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </label>
                  </div>
                )}
                <div className="min-w-0">
                  <label className="block text-sm font-medium text-gray-700 mb-2 md:sr-only">
                    Poster Color
                  </label>
                  <div className="flex items-center space-x-3">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        className={`size-8 rounded-full border-2 flex items-center justify-center ${
                          selectedColor === color.value
                            ? "border-gray-800"
                            : "border-transparent"
                        } ${color.class}`}
                        onClick={() => setValue("selectedColor", color.value)}
                        aria-label={`Select ${color.name} color`}
                      >
                        {selectedColor === color.value && (
                          <CheckIcon className="h-5 w-5 text-white" />
                        )}
                      </button>
                    ))}
                    <div className="flex items-center">
                      <Controller
                        name="selectedColor"
                        control={control}
                        render={({ field }) => (
                          <ColorPicker
                            value={field.value}
                            onChange={(value) => field.onChange(value)}
                            className="size-8 rounded-full"
                          />
                        )}
                      />
                      <span className="ml-2 text-xs text-gray-500 md:hidden">Custom</span>
                    </div>
                  </div>
                </div>
                </div>
              </div>
              </div>
            </CardContent>
            <CardFooter className="px-4 md:px-5 flex-col items-stretch gap-2 shrink-0">
              <motion.div
                whileHover={{
                  scale: 1.02,
                  transition: {
                    duration: 0.2,
                  },
                }}
              >
                <Button
                  type="button"
                  onClick={handleDownload}
                  disabled={!isValid || exporting !== null}
                  className="w-full bg-gray-800 text-white text-xl md:text-lg font-bold py-8 md:py-5 rounded-lg shadow-lg hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {exporting === "download" ? "PREPARING…" : "DOWNLOAD"}
                </Button>
              </motion.div>
              <div
                className={
                  poster.supportsShare
                    ? "grid grid-cols-2 gap-2 w-full"
                    : "grid grid-cols-1 w-full"
                }
              >
                {poster.supportsShare && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleShare}
                    disabled={!isValid || exporting !== null}
                    className="h-12 md:h-10 border-gray-800 text-gray-800 font-semibold hover:bg-gray-800 hover:text-white"
                  >
                    <Share2Icon className="h-4 w-4" />
                    {exporting === "share" ? "Preparing…" : "Share"}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrint}
                  disabled={!isValid || exporting !== null}
                  className="h-12 md:h-10 border-gray-800 text-gray-800 font-semibold hover:bg-gray-800 hover:text-white"
                >
                  <PrinterIcon className="h-4 w-4" />
                  {exporting === "print" ? "Preparing…" : "Print"}
                </Button>
              </div>
            </CardFooter>
          </Card>

          <div className="text-center text-gray-500 mt-2 text-sm md:hidden">
            Download It, Share It , Stick it anywhere !
          </div>
        </div>

        {/* Right Column - Poster Preview */}
        <PosterPreview
          previewUrl={poster.previewUrl}
          isRendering={poster.isRendering}
          error={poster.error}
          selectedSize={selectedSize}
          sizes={POSTER_SIZES}
          onSizeSelect={setSelectedSize}
        />
      </div>
    </div>
  );
}
