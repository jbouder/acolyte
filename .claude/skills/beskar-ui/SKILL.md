---

name: beskar-ui
description: >-
Add and use components from the Beskar design system (the @beskar shadcn
registry) in this app. Use when asked to "add a beskar component", "use the
beskar button/dialog/sidebar/table", "install the beskar theme", "build
<something> with beskar", "set up light and dark mode", "add a toast", "add
a form field with an error", or "add a transition or animation". Covers
registry setup (the @beskar namespace in components.json and the shadcn add
command), the component catalog (parts, variants, sizes), the Base UI render
prop convention, theming (tokens, status and tone colors, fonts, light and
dark), the theme hooks, motion tokens, and the accessibility rules to keep.
---

# Using the Beskar design system

[Beskar](https://github.com/jbouder/beskar) is a
[shadcn registry](https://ui.shadcn.com/docs/registry). The `shadcn` CLI copies
its components into this app as source. There is no npm package.

- Style: shadcn `base-lyra` on [Base UI](https://base-ui.com). No Radix.
- Fonts: Oxanium for UI and headings, JetBrains Mono for code.
- Icons: Phosphor (`@phosphor-icons/react`).
- Corners: square. The radius token is 0.
- Storybook, with every component and token: <https://beskar.vibeproject.workers.dev>

## Step 1: register the `@beskar` namespace (once)

Add the registry to this app's `components.json`. Keep the rest of the file.

```json
{
  "registries": {
    "@beskar": "https://beskar.vibeproject.workers.dev/r/{name}.json"
  }
}
```

The app needs a `components.json` first. Run `bunx shadcn init` if it has none.
Tailwind v4 is required.

## Step 2: install the theme (once)

```sh
bunx shadcn add @beskar/theme
```

This writes the tokens, the font imports, the dark variant, and the base layer
into the app's global CSS, and installs the font packages. It is safe to run
again after an update.

## Step 3: add components

```sh
bunx shadcn add @beskar/button @beskar/dialog
```

Each component pulls in the theme, `utils`, and any components it builds on.
You do not list those yourself.

To see what exists, fetch the manifest or one item:

```sh
curl -s https://beskar.vibeproject.workers.dev/r/registry.json
curl -s https://beskar.vibeproject.workers.dev/r/button.json
```

## Treat installed components as managed

Files under `components/ui` that came from `@beskar` are upstream source.

- Do not edit them to change a look for one screen. Pass `className` at the
  call site. The caller's classes win.
- Do not copy one to make a variation. Compose the parts instead.
- When a component needs a real change, make it in the Beskar repo and
  reinstall with `bunx shadcn add @beskar/<name> --overwrite`.
- Check the catalog before you build a new primitive. If Beskar has it, use it.

## Catalog

Import from `@/components/ui/<name>`.

### Form basics

| Item           | Parts                                                                                                                                                                                                                                                                                        | Notes                                                                                                                                                       |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `button`       | `Button`, `buttonVariants`                                                                                                                                                                                                                                                                   | `variant`: `default`, `outline`, `secondary`, `ghost`, `destructive`, `link`. `size`: `default`, `xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`. |
| `input`        | `Input`                                                                                                                                                                                                                                                                                      | A styled `<input>`.                                                                                                                                         |
| `textarea`     | `Textarea`                                                                                                                                                                                                                                                                                   | Grows with its content.                                                                                                                                     |
| `label`        | `Label`                                                                                                                                                                                                                                                                                      | Tie it to a control with `htmlFor`.                                                                                                                         |
| `checkbox`     | `Checkbox`                                                                                                                                                                                                                                                                                   | Base UI checkbox. `checked`, `onCheckedChange`.                                                                                                             |
| `switch`       | `Switch`                                                                                                                                                                                                                                                                                     | `size`: `default`, `sm`.                                                                                                                                    |
| `field`        | `Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldContent`, `FieldTitle`, `FieldGroup`, `FieldSet`, `FieldLegend`, `FieldSeparator`                                                                                                                                             | Layout for a control with its label, help, and error. `orientation`: `vertical`, `horizontal`, `responsive`.                                                |
| `input-group`  | `InputGroup`, `InputGroupInput`, `InputGroupTextarea`, `InputGroupAddon`, `InputGroupButton`, `InputGroupText`                                                                                                                                                                               | Icons, text, and buttons inside an input. Addon `align`: `inline-start`, `inline-end`, `block-start`, `block-end`.                                          |
| `toggle`       | `Toggle`, `toggleVariants`                                                                                                                                                                                                                                                                   | A pressed or not pressed button. `variant`: `default`, `outline`. `size`: `default`, `sm`, `lg`.                                                            |
| `toggle-group` | `ToggleGroup`, `ToggleGroupItem`                                                                                                                                                                                                                                                             | One value by default, several with `multiple`. `spacing={0}` joins the items.                                                                               |
| `select`       | `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`, `SelectGroup`, `SelectLabel`, `SelectSeparator`                                                                                                                                                                     | Pick one from a short list.                                                                                                                                 |
| `combobox`     | `Combobox`, `ComboboxInput`, `ComboboxContent`, `ComboboxList`, `ComboboxItem`, `ComboboxEmpty`, `ComboboxGroup`, `ComboboxLabel`, `ComboboxChips`, `ComboboxChip`, `ComboboxChipsInput`, `ComboboxValue`, `ComboboxTrigger`, `ComboboxSeparator`, `ComboboxCollection`, `useComboboxAnchor` | A searchable select. Chips for multiple values.                                                                                                             |
| `calendar`     | `Calendar`                                                                                                                                                                                                                                                                                   | Wraps `react-day-picker`. `mode`: `single`, `multiple`, `range`. Put it in a `Popover` for a date picker.                                                   |

### Display

| Item        | Parts                                                                                                    | Notes                                                                         |
| ----------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `badge`     | `Badge`, `badgeVariants`                                                                                 | `variant`: `default`, `secondary`, `destructive`, `outline`, `ghost`, `link`. |
| `card`      | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter`          | `size`: `default`, `sm`.                                                      |
| `alert`     | `Alert`, `AlertTitle`, `AlertDescription`, `AlertAction`                                                 | `variant`: `default`, `destructive`. Has `role="alert"`.                      |
| `avatar`    | `Avatar`, `AvatarImage`, `AvatarFallback`, `AvatarBadge`, `AvatarGroup`, `AvatarGroupCount`              | `size`: `sm`, `default`, `lg`. Always give a fallback.                        |
| `table`     | `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption` | Scrolls sideways in its own container.                                        |
| `empty`     | `Empty`, `EmptyHeader`, `EmptyMedia`, `EmptyTitle`, `EmptyDescription`, `EmptyContent`                   | An empty state. `EmptyMedia` `variant`: `default`, `icon`.                    |
| `progress`  | `Progress`, `ProgressLabel`, `ProgressValue`                                                             | `value` from 0 to 100, or `null` when unknown.                                |
| `spinner`   | `Spinner`                                                                                                | Announces "Loading". Size it with `size-*`.                                   |
| `skeleton`  | `Skeleton`                                                                                               | A placeholder. Size it with utilities.                                        |
| `separator` | `Separator`                                                                                              | `orientation`: `horizontal`, `vertical`.                                      |
| `tabs`      | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`                                                         | `TabsList` `variant`: `default`, `line`.                                      |

### Overlays and menus

| Item            | Parts                                                                                                                                                                                                                                                                                                                             | Notes                                                                |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `dialog`        | `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose`                                                                                                                                                                                                     | A modal. Always include a `DialogTitle`.                             |
| `alert-dialog`  | `AlertDialog`, `AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogMedia`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogAction`, `AlertDialogCancel`                                                                                                                   | Confirm a destructive or irreversible action.                        |
| `sheet`         | `Sheet`, `SheetTrigger`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription`, `SheetFooter`, `SheetClose`                                                                                                                                                                                                             | A panel from an edge. `side`: `top`, `right`, `bottom`, `left`.      |
| `popover`       | `Popover`, `PopoverTrigger`, `PopoverContent`, `PopoverHeader`, `PopoverTitle`, `PopoverDescription`                                                                                                                                                                                                                              | Floating content tied to a trigger.                                  |
| `tooltip`       | `TooltipProvider`, `Tooltip`, `TooltipTrigger`, `TooltipContent`                                                                                                                                                                                                                                                                  | Mount one `TooltipProvider` at the app root.                         |
| `dropdown-menu` | `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, `DropdownMenuLabel`, `DropdownMenuGroup`, `DropdownMenuSeparator`, `DropdownMenuShortcut`, `DropdownMenuSub`, `DropdownMenuSubTrigger`, `DropdownMenuSubContent` | Item `variant`: `default`, `destructive`.                            |
| `command`       | `Command`, `CommandDialog`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`, `CommandSeparator`, `CommandShortcut`                                                                                                                                                                                   | A command palette on `cmdk`.                                         |
| `sonner`        | `Toaster`                                                                                                                                                                                                                                                                                                                         | Toasts. Mount `<Toaster />` once, then call `toast()` from `sonner`. |

### App shell

| Item      | Parts                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Notes                                                                                                                                                         |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sidebar` | `SidebarProvider`, `Sidebar`, `SidebarHeader`, `SidebarContent`, `SidebarFooter`, `SidebarGroup`, `SidebarGroupLabel`, `SidebarGroupAction`, `SidebarGroupContent`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`, `SidebarMenuAction`, `SidebarMenuBadge`, `SidebarMenuSkeleton`, `SidebarMenuSub`, `SidebarMenuSubItem`, `SidebarMenuSubButton`, `SidebarInput`, `SidebarSeparator`, `SidebarRail`, `SidebarTrigger`, `SidebarInset`, `useSidebar` | `collapsible`: `offcanvas`, `icon`, `none`. `variant`: `sidebar`, `floating`, `inset`. Becomes a sheet below the `md` breakpoint. Ctrl+B or Cmd+B toggles it. |

### Hooks and helpers

| Item                   | Exports                                                                   | Notes                                                                       |
| ---------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `use-theme-preference` | `useThemePreference`, `themeBootstrapScript`, `ThemeProvider`, `useTheme` | Light, dark, and system theme state. See [Light and dark](#light-and-dark). |
| `use-mobile`           | `useIsMobile`                                                             | True below the `md` breakpoint.                                             |
| `utils`                | `cn`                                                                      | Merges class names. Installed for you.                                      |
| `theme`                |                                                                           | Tokens, fonts, and the base layer.                                          |

## Composition: the Base UI `render` prop

Beskar components do not have `asChild`. To render a part as another element
or component, pass `render`.

```tsx
<DialogTrigger render={<Button variant="outline" />}>Open</DialogTrigger>

<TooltipTrigger render={<Button size="icon" aria-label="Refresh" />}>
  <ArrowsClockwiseIcon />
</TooltipTrigger>

<SidebarMenuButton render={<a href="/boards" />}>Boards</SidebarMenuButton>
```

`Button` keeps button semantics even through `render`. For a navigation link
that looks like a button, put the classes on a real link:

```tsx
<a className={buttonVariants({ variant: 'outline' })} href="/docs">
  Docs
</a>;
```

## Theming

Use the semantic tokens. Do not hard-code a color, a font, a radius, or a
duration.

| Purpose         | Utilities                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------- |
| Page            | `bg-background`, `text-foreground`                                                                 |
| Raised surfaces | `bg-card text-card-foreground`, `bg-popover text-popover-foreground`                               |
| Main action     | `bg-primary text-primary-foreground`                                                               |
| Quiet fills     | `bg-secondary`, `bg-muted`, `bg-accent`, each with its `-foreground`                               |
| Secondary text  | `text-muted-foreground`                                                                            |
| Lines and focus | `border-border`, `border-input`, `ring-ring`                                                       |
| Error           | `text-destructive`, `bg-destructive/10`                                                            |
| Success         | `bg-ok text-ok-foreground`, `text-ok`                                                              |
| Warning         | `bg-warn text-warn-foreground`, `text-warn`                                                        |
| Categories      | `text-tone-<name>` on `bg-tone-<name>-soft`, for `violet`, `cyan`, `green`, `amber`, `red`, `blue` |
| Charts          | `chart-1` to `chart-5`                                                                             |
| Sidebar         | `bg-sidebar`, `text-sidebar-foreground`, `bg-sidebar-accent`                                       |
| Glow effect     | `fx-glow`                                                                                          |

Rules:

- Status means `ok`, `warn`, or `destructive`. Do not use a tone color to mean
  success or failure.
- A tone ink goes on its own soft fill, or on the page. Other pairings are not
  checked for contrast.
- Never rely on color alone. Pair a status color with text or an icon.
- Fonts: `font-sans` is Oxanium, `font-mono` is JetBrains Mono, and
  `font-heading` follows `font-sans`. Body text is `text-xs`. The scale is
  small on purpose.
- Corners are square. Do not add `rounded-*`, except `rounded-full` for
  avatars and dots.
- Icons come from `@phosphor-icons/react`, with the `Icon` suffix
  (`PlusIcon`). Hide a decorative icon with `aria-hidden="true"`.

### An app-specific palette

Beskar ships one neutral palette. An app that wants its own look overrides
token values in its own CSS, after the Beskar theme. Keep the token names.

```css
.dark {
  --primary: oklch(0.6 0.2 25);
  --ring: oklch(0.6 0.2 25);
}
```

Check any new text and surface pair for 4.5:1 contrast.

### Light and dark

Dark mode is the `.dark` class on `<html>`. Install the hook:

```sh
bunx shadcn add @beskar/use-theme-preference
```

Mount the provider once at the root, then read or set the mode anywhere.

```tsx
import { ThemeProvider, useTheme } from '@/hooks/theme-provider';

function App() {
  return (
    <ThemeProvider>
      <Routes />
    </ThemeProvider>
  );
}

function ThemeToggle() {
  const { themeMode, isDarkMode, setThemeMode } = useTheme();
  // themeMode is 'light', 'dark', or 'system'.
}
```

The choice is saved in `localStorage` under `beskar:themeMode`. Pass
`storageKey` to the provider to change it.

To stop a flash of the wrong theme, run `themeBootstrapScript()` from
`@/hooks/use-theme-preference` in a `<script>` at the top of `<head>`, before
the app loads.

Offer all three modes in a theme picker. A `DropdownMenuRadioGroup` fits.

## Motion

The theme defines the motion tokens. Use them in place of raw values.

| Token               | Value | Use                 |
| ------------------- | ----- | ------------------- |
| `--duration-fast`   | 100ms | Hover, press, focus |
| `--duration-base`   | 200ms | Overlays, panels    |
| `--duration-slow`   | 350ms | Large moves         |
| `--ease-standard`   |       | Most transitions    |
| `--ease-emphasized` |       | Entrances           |

```tsx
<div className="transition-colors duration-(--duration-fast) ease-(--ease-standard)" />
<div className="motion-safe:animate-in motion-safe:fade-in duration-(--duration-base)" />
```

- Write `duration-(--token)` and `ease-(--token)`. The older
  `duration-[--token]` form compiles to nothing in Tailwind v4.
- Gate decorative animation with `motion-safe:`. The theme also cuts all
  transitions and animations to zero under `prefers-reduced-motion`.
- Animate `opacity` and `transform`. Avoid animating layout.
- The components already animate their own states. Do not add a second
  transition on top.

## Accessibility rules to keep

Every Beskar component passes axe in Storybook. Keep that true at the call
site.

- An icon-only button, toggle, or trigger needs an `aria-label`.
- Every `Dialog`, `AlertDialog`, and `Sheet` needs a title. Hide it with
  `sr-only` if the design has none.
- Tie a `Label` or `FieldLabel` to its control with `htmlFor`. Tie help and
  error text with `aria-describedby`.
- For an invalid control, set `aria-invalid` on the control and `data-invalid`
  on the `Field`.
- Use `AlertDialog`, not `Dialog`, to confirm a destructive action.
- A `Progress` or `Spinner` without visible text needs an `aria-label`.
- Do not remove focus rings.

## Recipes

### A form field with an error

```tsx
<Field data-invalid={error ? 'true' : undefined}>
  <FieldLabel htmlFor="email">Email</FieldLabel>
  <Input
    aria-describedby={error ? 'email-error' : undefined}
    aria-invalid={error ? 'true' : undefined}
    id="email"
    type="email"
  />
  {error && <FieldError id="email-error">{error}</FieldError>}
</Field>;
```

### A toast

```tsx
// Once, at the app root:
import { Toaster } from '@/components/ui/sonner';
<Toaster />;

// Anywhere:
import { toast } from 'sonner';
toast.success('Board saved');
```

### A confirm before delete

```tsx
<AlertDialog>
  <AlertDialogTrigger render={<Button variant="destructive" />}>
    Delete
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete this board?</AlertDialogTitle>
      <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction variant="destructive" onClick={onDelete}>
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>;
```

### An app shell with a sidebar

```tsx
<TooltipProvider>
  <SidebarProvider>
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive
                render={<a aria-current="page" href="/" />}
                tooltip="Home"
              >
                <HouseIcon aria-hidden="true" />
                <span>Home</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
    <SidebarInset>
      <header className="flex h-12 items-center gap-2 border-b px-3">
        <SidebarTrigger />
      </header>
      {children}
    </SidebarInset>
  </SidebarProvider>
</TooltipProvider>;
```

### An empty state

```tsx
<Empty>
  <EmptyHeader>
    <EmptyMedia variant="icon">
      <FolderOpenIcon aria-hidden="true" />
    </EmptyMedia>
    <EmptyTitle>No boards yet</EmptyTitle>
    <EmptyDescription>Boards you create show up here.</EmptyDescription>
  </EmptyHeader>
  <EmptyContent>
    <Button>Create a board</Button>
  </EmptyContent>
</Empty>;
```

## When something is missing

If Beskar has no component for the job, check whether stock shadcn
`base-lyra` covers it. Tell the user, and suggest adding it to Beskar so every
app gets it. Do not hand-build a look-alike in the app.
