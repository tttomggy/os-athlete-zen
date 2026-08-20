import { useState } from "react";
import type { EntryExtras, EntryKind } from "@/lib/os-store";
import { ChipRow, Field, SelectInput, Stepper, SubmitButton, TextInput } from "./fields";

type Props = {
  onLog: (
    kind: EntryKind,
    title: string,
    details: string[],
    extras?: EntryExtras,
  ) => void | Promise<void>;
};

export function SwimForm({ onLog }: Props) {
  const [stroke, setStroke] = useState("Freestyle");
  const [meters, setMeters] = useState("");
  const [pace, setPace] = useState("");
  const [splits, setSplits] = useState("");

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!meters) return;
        onLog("swim", `${stroke} · ${meters} m`, [
          pace && `Pace ${pace} /100m`,
          splits && `Splits ${splits}`,
        ].filter(Boolean) as string[]);
        setMeters("");
        setPace("");
        setSplits("");
      }}
    >
      <Field label="Stroke">
        <ChipRow
          options={["Freestyle", "Backstroke", "Breaststroke", "Butterfly", "IM"]}
          value={stroke}
          onChange={setStroke}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Total meters">
          <TextInput
            inputMode="numeric"
            placeholder="2000"
            value={meters}
            onChange={(e) => setMeters(e.target.value)}
          />
        </Field>
        <Field label="Pace / 100m">
          <TextInput
            placeholder="1:32"
            value={pace}
            onChange={(e) => setPace(e.target.value)}
          />
        </Field>
      </div>
      <Field label="Split times">
        <TextInput
          placeholder="1:30, 1:33, 1:35"
          value={splits}
          onChange={(e) => setSplits(e.target.value)}
        />
      </Field>
      <SubmitButton>Log swim</SubmitButton>
    </form>
  );
}

export function GymForm({ onLog }: Props) {
  const [name, setName] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [group, setGroup] = useState("Push");

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name) return;
        onLog("gym", name, [
          `${sets || "?"} × ${reps || "?"}`,
          weight && `${weight} kg`,
          group,
        ].filter(Boolean) as string[]);
        setName("");
        setSets("");
        setReps("");
        setWeight("");
      }}
    >
      <Field label="Exercise">
        <TextInput
          placeholder="Bench press"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Sets">
          <TextInput inputMode="numeric" placeholder="4" value={sets} onChange={(e) => setSets(e.target.value)} />
        </Field>
        <Field label="Reps">
          <TextInput inputMode="numeric" placeholder="8" value={reps} onChange={(e) => setReps(e.target.value)} />
        </Field>
        <Field label="Weight">
          <TextInput inputMode="decimal" placeholder="80" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </Field>
      </div>
      <Field label="Muscle group">
        <ChipRow
          options={["Push", "Pull", "Legs", "Core", "Shoulders", "Back"]}
          value={group}
          onChange={setGroup}
        />
      </Field>
      <SubmitButton>Log lift</SubmitButton>
    </form>
  );
}

export function FuelForm({ onLog }: Props) {
  const [meal, setMeal] = useState("Breakfast");
  const [calories, setCalories] = useState("");
  const [proteinPalms, setProteinPalms] = useState(0);
  const [carbCups, setCarbCups] = useState(0);
  const [fatThumbs, setFatThumbs] = useState(0);
  const [notes, setNotes] = useState("");

  const hasInput = Boolean(calories) || proteinPalms > 0 || carbCups > 0 || fatThumbs > 0;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!hasInput) return;
        const details = [
          calories && `${calories} kcal`,
          proteinPalms > 0 && `${proteinPalms} palm${proteinPalms > 1 ? "s" : ""} protein`,
          carbCups > 0 && `${carbCups} cup${carbCups > 1 ? "s" : ""} carbs`,
          fatThumbs > 0 && `${fatThumbs} thumb${fatThumbs > 1 ? "s" : ""} fat`,
        ].filter(Boolean) as string[];
        const extras: EntryExtras = {
          fuel_protein_palms: proteinPalms || null,
          fuel_carb_cups: carbCups || null,
          fuel_fat_thumbs: fatThumbs || null,
          notes: notes.trim() || null,
        };
        onLog("fuel", meal, details, extras);
        setCalories("");
        setProteinPalms(0);
        setCarbCups(0);
        setFatThumbs(0);
        setNotes("");
      }}
    >
      <Field label="Meal type">
        <ChipRow
          options={["Breakfast", "Lunch", "Dinner", "Snack", "Pre-swim", "Post-lift"]}
          value={meal}
          onChange={setMeal}
        />
      </Field>
      <Field label="Calories">
        <TextInput
          inputMode="numeric"
          placeholder="620"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
        />
      </Field>
      <div className="grid grid-cols-3 gap-2">
        <Stepper
          label="Protein palms"
          value={proteinPalms}
          onChange={setProteinPalms}
          accent="var(--fuel)"
        />
        <Stepper
          label="Carb cups"
          value={carbCups}
          onChange={setCarbCups}
          accent="var(--swim)"
        />
        <Stepper
          label="Fat thumbs"
          value={fatThumbs}
          onChange={setFatThumbs}
          accent="var(--gym)"
        />
      </div>
      <Field label="Notes">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Chicken rice bowl, felt light…"
          className="glass-field w-full p-3.5 text-base"
        />
      </Field>
      <SubmitButton>Log fuel</SubmitButton>
    </form>
  );
}

export function RecoveryForm({ onLog }: Props) {
  const [duration, setDuration] = useState("7.5");
  const [quality, setQuality] = useState("Good");
  const [notes, setNotes] = useState("");

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onLog("recovery", `Sleep ${duration} h`, [`Quality ${quality}`, notes].filter(Boolean) as string[]);
        setNotes("");
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Sleep duration (h)">
          <TextInput inputMode="decimal" value={duration} onChange={(e) => setDuration(e.target.value)} />
        </Field>
        <Field label="Sleep quality">
          <SelectInput
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
            options={["Excellent", "Good", "Average", "Restless", "Poor"]}
          />
        </Field>
      </div>
      <Field label="Notes">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Legs heavy, sauna 15 min…"
          className="glass-field w-full p-3.5 text-base"
        />
      </Field>
      <SubmitButton>Log recovery</SubmitButton>
    </form>
  );
}
