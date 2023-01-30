import { Button, Heading, TextField, View } from "@aws-amplify/ui-react";
import Head from "next/head";
import { SyntheticEvent, useState } from "react";
import { ArtCardCollection, ArtUpdateForm } from "@/ui-components";
import { DataStore } from "aws-amplify";
import { Art, LazyArt } from "@/models";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updatePhoto, setUpdatePhoto] = useState<LazyArt>();
  const generatePhoto = async (input: string, negativePrompt: string) => {
    setLoading(true);

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt: input, negative_prompt: negativePrompt })
    });

    let photo = await res.json();

    if (res.status !== 200) {
      console.log("error");
    } else {
      await DataStore.save(
        new Art({
          negative_prompt: negativePrompt,
          prompt: input,
          timestamp: new Date().toISOString(),
          url: photo[0]
        })
      );
    }
    setLoading(false);
  };

  const onSubmit = (e: SyntheticEvent) => {
    e.preventDefault();
    const target = e.target as typeof e.target & {
      prompt: { value: string };
      negative_prompt: { value: string };
    };

    if (target.prompt.value.trim() === "" || loading) return;
    generatePhoto(
      target.prompt.value.trim(),
      target.negative_prompt.value.trim()
    );
    target.prompt.value = "";
    target.negative_prompt.value = "";
  };
  return (
    <>
      <Head>
        <title>AI Generator</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="container">
        <Heading level={1}>Text 2 Image</Heading>
        <form onSubmit={onSubmit}>
          <TextField label="Prompt" name="prompt" />
          <TextField label="Negative Prompt" name="negative_prompt" />
          <Button type="submit" variation="primary" disabled={loading}>
            Generate
          </Button>
        </form>
        <ArtCardCollection
          overrideItems={({
            item,
            index
          }: {
            item: LazyArt;
            index: number;
          }) => ({
            overrides: {
              Pencil: {
                as: "button",
                style: { cursor: "pointer" },
                onClick: () => {
                  setUpdatePhoto(item);
                  setShowUpdateModal(true);
                }
              },
              Trash: {
                as: "button",
                style: { cursor: "pointer" }
              }
            }
          })}
        />
      </div>
      <View
        className="modal"
        style={{
          display: showUpdateModal === false && "none"
        }}
      >
        <ArtUpdateForm
          overrides={{
            ResetButton: {
              onClick: () => setShowUpdateModal(false),
              children: "Cancel"
            }
          }}
          art={updatePhoto}
          onSuccess={() => setShowUpdateModal(false)}
        />
      </View>
    </>
  );
}
