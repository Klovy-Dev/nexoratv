import { Fragment } from "react";

const STARS = [5, 4, 3, 2, 1];

export default function StarRatingInput({
  name = "rating",
  defaultValue = 5,
}: {
  name?: string;
  defaultValue?: number;
}) {
  return (
    <div className="star-input">
      {STARS.map((n) => (
        <Fragment key={n}>
          <input
            type="radio"
            id={`${name}-${n}`}
            name={name}
            value={n}
            defaultChecked={n === defaultValue}
            required
          />
          <label htmlFor={`${name}-${n}`} aria-label={`${n} étoile${n > 1 ? "s" : ""}`}>
            ★
          </label>
        </Fragment>
      ))}
    </div>
  );
}
