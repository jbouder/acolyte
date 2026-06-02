'use client';

import { useRef, useState } from 'react';
import NextImage from 'next/image';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type UploadedImage = {
  name: string;
  dataUrl: string;
  width: number;
  height: number;
};

type CropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type OutputFormat = 'image/png' | 'image/jpeg' | 'image/webp';

const maxFileSize = 10 * 1024 * 1024;
const faviconIcoSizes = [16, 32, 48];
const faviconPngSizes = [180, 192, 512];

const extensionByFormat: Record<OutputFormat, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

const loadImage = (dataUrl: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Unable to load image'));
    image.src = dataUrl;
  });

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Unable to export image'));
        }
      },
      type,
      quality,
    );
  });

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const appendBytes = (target: Uint8Array, bytes: Uint8Array, offset: number) => {
  target.set(bytes, offset);
  return offset + bytes.byteLength;
};

const createIcoBlob = (pngBuffers: ArrayBuffer[]) => {
  const directorySize = 6 + pngBuffers.length * 16;
  const totalSize =
    directorySize +
    pngBuffers.reduce((size, buffer) => size + buffer.byteLength, 0);
  const icoBytes = new Uint8Array(totalSize);
  const view = new DataView(icoBytes.buffer);

  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, pngBuffers.length, true);

  let imageOffset = directorySize;
  pngBuffers.forEach((buffer, index) => {
    const size = faviconIcoSizes[index];
    const directoryOffset = 6 + index * 16;

    view.setUint8(directoryOffset, size === 256 ? 0 : size);
    view.setUint8(directoryOffset + 1, size === 256 ? 0 : size);
    view.setUint8(directoryOffset + 2, 0);
    view.setUint8(directoryOffset + 3, 0);
    view.setUint16(directoryOffset + 4, 1, true);
    view.setUint16(directoryOffset + 6, 32, true);
    view.setUint32(directoryOffset + 8, buffer.byteLength, true);
    view.setUint32(directoryOffset + 12, imageOffset, true);

    imageOffset = appendBytes(
      icoBytes,
      new Uint8Array(buffer),
      imageOffset,
    );
  });

  return new Blob([icoBytes], { type: 'image/x-icon' });
};

export default function ImageToolsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<UploadedImage | null>(null);
  const [crop, setCrop] = useState<CropArea>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('image/png');
  const [quality, setQuality] = useState(92);
  const [resizeWidth, setResizeWidth] = useState('');
  const [resizeHeight, setResizeHeight] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const resetCrop = (width: number, height: number) => {
    setCrop({ x: 0, y: 0, width, height });
    setResizeWidth(String(width));
    setResizeHeight(String(height));
  };

  const updateCropValue = (field: keyof CropArea, value: string) => {
    setCrop((currentCrop) => ({
      ...currentCrop,
      [field]: Math.max(0, Math.round(Number(value) || 0)),
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }

    if (file.size > maxFileSize) {
      setError('Image size must be less than 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (loadEvent) => {
      try {
        const dataUrl = loadEvent.target?.result;
        if (typeof dataUrl !== 'string') {
          throw new Error('Unable to read image file');
        }

        const loadedImage = await loadImage(dataUrl);
        setImage({
          name: file.name,
          dataUrl,
          width: loadedImage.naturalWidth,
          height: loadedImage.naturalHeight,
        });
        resetCrop(loadedImage.naturalWidth, loadedImage.naturalHeight);
        setPreviewUrl(dataUrl);
        setError('');
        toast.success(`Loaded ${file.name}`);
      } catch {
        setError('Failed to load image. Please try another file.');
      }
    };
    reader.onerror = () => setError('Failed to read image file.');
    reader.readAsDataURL(file);
  };

  const getAdjustedCanvas = async (
    format: OutputFormat,
    sizeOverride?: number,
  ) => {
    if (!image) {
      throw new Error('Upload an image before exporting.');
    }

    const sourceImage = await loadImage(image.dataUrl);
    const cropX = Math.min(crop.x, image.width - 1);
    const cropY = Math.min(crop.y, image.height - 1);
    const cropWidth = Math.min(crop.width || image.width, image.width - cropX);
    const cropHeight = Math.min(
      crop.height || image.height,
      image.height - cropY,
    );
    const outputWidth = sizeOverride || Math.max(1, Number(resizeWidth));
    const outputHeight = sizeOverride || Math.max(1, Number(resizeHeight));
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Canvas is not supported in this browser.');
    }

    canvas.width = outputWidth;
    canvas.height = outputHeight;

    if (format === 'image/jpeg') {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }

    context.drawImage(
      sourceImage,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      outputWidth,
      outputHeight,
    );

    return canvas;
  };

  const previewAdjustedImage = async () => {
    try {
      setIsProcessing(true);
      setError('');
      const canvas = await getAdjustedCanvas(outputFormat);
      setPreviewUrl(canvas.toDataURL(outputFormat, quality / 100));
      toast.success('Preview updated');
    } catch (previewError) {
      setError(
        previewError instanceof Error
          ? previewError.message
          : 'Failed to preview image.',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadAdjustedImage = async () => {
    try {
      setIsProcessing(true);
      setError('');
      const canvas = await getAdjustedCanvas(outputFormat);
      const blob = await canvasToBlob(canvas, outputFormat, quality / 100);
      downloadBlob(blob, `adjusted-image.${extensionByFormat[outputFormat]}`);
      toast.success('Adjusted image downloaded');
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : 'Failed to download image.',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadFaviconIco = async () => {
    try {
      setIsProcessing(true);
      setError('');
      const pngBuffers = await Promise.all(
        faviconIcoSizes.map(async (size) => {
          const canvas = await getAdjustedCanvas('image/png', size);
          const blob = await canvasToBlob(canvas, 'image/png');
          return blob.arrayBuffer();
        }),
      );
      downloadBlob(createIcoBlob(pngBuffers), 'favicon.ico');
      toast.success('favicon.ico downloaded');
    } catch (faviconError) {
      setError(
        faviconError instanceof Error
          ? faviconError.message
          : 'Failed to generate favicon.',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadFaviconPngSet = async () => {
    try {
      setIsProcessing(true);
      setError('');
      for (const size of faviconPngSizes) {
        const canvas = await getAdjustedCanvas('image/png', size);
        const blob = await canvasToBlob(canvas, 'image/png');
        downloadBlob(blob, `icon-${size}x${size}.png`);
      }
      toast.success('Favicon PNG set downloaded');
    } catch (faviconError) {
      setError(
        faviconError instanceof Error
          ? faviconError.message
          : 'Failed to generate favicon PNGs.',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Image Tools</h1>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Image</CardTitle>
              <CardDescription>
                Load a PNG, JPEG, GIF, WebP, or SVG image up to 10MB.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Choose an image to crop, resize, convert, or turn into
                    favicons.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose Image
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              </div>

              {image && (
                <div className="rounded-md bg-muted p-3 text-sm">
                  <p className="font-medium">{image.name}</p>
                  <p className="text-muted-foreground">
                    {image.width} × {image.height}px
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Crop & Resize</CardTitle>
              <CardDescription>
                Set the source crop rectangle and output dimensions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="crop-x">
                    Crop X
                  </label>
                  <Input
                    id="crop-x"
                    type="number"
                    min="0"
                    value={crop.x}
                    onChange={(event) =>
                      updateCropValue('x', event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="crop-y">
                    Crop Y
                  </label>
                  <Input
                    id="crop-y"
                    type="number"
                    min="0"
                    value={crop.y}
                    onChange={(event) =>
                      updateCropValue('y', event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="crop-width">
                    Crop Width
                  </label>
                  <Input
                    id="crop-width"
                    type="number"
                    min="1"
                    value={crop.width}
                    onChange={(event) =>
                      updateCropValue('width', event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="crop-height">
                    Crop Height
                  </label>
                  <Input
                    id="crop-height"
                    type="number"
                    min="1"
                    value={crop.height}
                    onChange={(event) =>
                      updateCropValue('height', event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="output-width">
                    Output Width
                  </label>
                  <Input
                    id="output-width"
                    type="number"
                    min="1"
                    value={resizeWidth}
                    onChange={(event) => setResizeWidth(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium"
                    htmlFor="output-height"
                  >
                    Output Height
                  </label>
                  <Input
                    id="output-height"
                    type="number"
                    min="1"
                    value={resizeHeight}
                    onChange={(event) => setResizeHeight(event.target.value)}
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={!image}
                onClick={() => image && resetCrop(image.width, image.height)}
              >
                Reset to Full Image
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Convert & Export</CardTitle>
              <CardDescription>
                Convert images to PNG, JPEG, or WebP and control compression.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Output Format</label>
                  <Select
                    value={outputFormat}
                    onValueChange={(value) =>
                      setOutputFormat(value as OutputFormat)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select output format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image/png">PNG</SelectItem>
                      <SelectItem value="image/jpeg">JPEG</SelectItem>
                      <SelectItem value="image/webp">WebP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="quality">
                    Quality ({quality}%)
                  </label>
                  <Input
                    id="quality"
                    type="range"
                    min="1"
                    max="100"
                    value={quality}
                    disabled={outputFormat === 'image/png'}
                    onChange={(event) => setQuality(Number(event.target.value))}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={!image || isProcessing}
                  onClick={previewAdjustedImage}
                >
                  Preview Adjustments
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!image || isProcessing}
                  onClick={downloadAdjustedImage}
                >
                  Download Converted Image
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Favicon Generator</CardTitle>
              <CardDescription>
                Export a multi-size favicon.ico plus common web app icon PNGs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={!image || isProcessing}
                  onClick={downloadFaviconIco}
                >
                  Download favicon.ico
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!image || isProcessing}
                  onClick={downloadFaviconPngSet}
                >
                  Download Web App PNGs
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              Preview the source image or the latest adjusted output.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {previewUrl ? (
              <div className="flex min-h-[420px] items-center justify-center rounded-lg border bg-muted/30 p-4">
                <NextImage
                  src={previewUrl}
                  alt="Selected preview"
                  width={image?.width || 1}
                  height={image?.height || 1}
                  unoptimized
                  className="max-h-[640px] max-w-full rounded-md object-contain shadow-sm"
                />
              </div>
            ) : (
              <div className="flex min-h-[420px] items-center justify-center rounded-lg border border-dashed text-center text-muted-foreground">
                <p>Upload an image to see a preview.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
