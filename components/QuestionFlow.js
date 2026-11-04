"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { decisionTree } from "@/lib/facilities";
import { buildResultHref, getVisibleOptions, pruneAnswers } from "@/lib/decision";
import { ChevronRightIcon } from "@/components/Icons";

const questions = decisionTree.questions;

export default function QuestionFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [locked, setLocked] = useState(false);
  const touch = useRef({ x: 0, y: 0, active: false });
  const advanceTimer = useRef(null);

  useEffect(() => {
    return () => {
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    };
  }, []);

  const question = questions[step];
  const options = getVisibleOptions(question, answers);
  const selected = options.some((option) => option.id === answers[question.id])
    ? answers[question.id]
    : undefined;

  function choose(option) {
    if (locked) return;
    const nextAnswers = pruneAnswers(decisionTree, {
      ...answers,
      [question.id]: option.id,
    });
    setAnswers(nextAnswers);
    setLocked(true);

    if (question.id === "danger" && option.danger) {
      router.push(buildResultHref(decisionTree, nextAnswers));
      return;
    }

    if (step === questions.length - 1) {
      router.push(buildResultHref(decisionTree, nextAnswers));
      return;
    }

    advanceTimer.current = window.setTimeout(() => {
      setStep((current) => Math.min(current + 1, questions.length - 1));
      setLocked(false);
    }, 220);
  }

  function goToStep(nextStep) {
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    setLocked(false);
    setStep(nextStep);
  }

  function goBack() {
    if (step === 0) {
      router.push("/");
      return;
    }
    goToStep(Math.max(step - 1, 0));
  }

  function onTouchStart(event) {
    const point = event.changedTouches[0];
    touch.current = { x: point.clientX, y: point.clientY, active: true };
  }

  function onTouchEnd(event) {
    if (!touch.current.active) return;
    const point = event.changedTouches[0];
    const dx = point.clientX - touch.current.x;
    const dy = point.clientY - touch.current.y;
    touch.current.active = false;

    if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    if (dx > 0 && step > 0) {
      goToStep(Math.max(step - 1, 0));
    } else if (dx < 0 && selected && step < questions.length - 1) {
      goToStep(Math.min(step + 1, questions.length - 1));
    }
  }

  const progress = Math.round(((step + 1) / questions.length) * 100);

  return (
    <div>
      <div className="progress-wrap">
        <div className="progress-meta">
          <span>
            سؤال {step + 1} من {questions.length}
          </span>
          <Link href="/" className="link-btn" style={{ minHeight: "auto", padding: 0 }}>
            إلغاء
          </Link>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="تقدم الأسئلة"
        >
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <section
        className="question"
        key={question.id}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <h1>{question.title}</h1>
        {question.subtitle ? <p className="sub">{question.subtitle}</p> : null}

        <div
          className={`options${question.columns === 2 ? " options--2" : ""}`}
          role="group"
          aria-label={question.title}
        >
          {options.map((option) => {
            const isSelected = selected === option.id;
            const classes = [
              "option",
              isSelected ? "is-selected" : "",
              option.danger ? "option--danger" : "",
              option.id === "none" ? "option--safe" : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <button
                key={option.id}
                type="button"
                className={classes}
                onClick={() => choose(option)}
                aria-pressed={isSelected}
              >
                <span className="option__icon" aria-hidden="true">
                  {option.icon}
                </span>
                <span className="option__label">{option.label}</span>
              </button>
            );
          })}
        </div>

        <div className="question-actions">
          <button type="button" className="link-btn" onClick={goBack}>
            <ChevronRightIcon />
            السابق
          </button>
          {selected && step < questions.length - 1 && question.id !== "danger" ? (
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                goToStep(Math.min(step + 1, questions.length - 1));
              }}
            >
              التالي
            </button>
          ) : null}
        </div>
      </section>

      <p className="tiny muted" style={{ textAlign: "center", marginTop: 18 }}>
        يمكنك السحب يميناً للرجوع إلى السؤال السابق.
      </p>
    </div>
  );
}
