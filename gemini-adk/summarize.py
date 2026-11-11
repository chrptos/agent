import argparse
import asyncio

import config  # noqa: F401  環境変数(プロジェクト/モデル)を初期化する
from google.adk.agents import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

SAMPLE_TEXT = """\
聖マルティヌスの日は収穫祭の日であり、冬の始まりの日ともされる。

農民が一年を締めくくる日でもあり、元々クリスマスに行われていた雇用契約の更新や、地代の支払いもこの日に行われるようになった。子供たちは、ランタンに火をともして、自分が住む町の市長が扮する聖マルティヌスを教会に案内し、その見返りとしてパンをもらう。また、家々を一軒ずつ回って、祝福の言葉を述べ、その家の人が、パンや菓子を与える[2]。

スイスでは、カブやカボチャをくりぬいてランタンを作り、山車に乗せて行進が行われる[3]。また、豊作を祈願して、畑で焚き火をする。

プロテスタントでは、この日は、聖マルティヌスではなく、宗教改革を起こしたマルティン・ルターを祝う意味でこの行事を行う[2]。ルター自身、前日の11月10日に生まれ、そのためマルティンと名づけられた[1]。

この日はまた、ガチョウを食べる日でもある[3]。脂の乗ったガチョウをローストして、紫キャベツとジャガイモのダンプリングを付け合わせる。ガチョウを食べる理由として、かつて聖マルティヌスがトゥールの司教を依頼されたもののその気になれず、使いに見つからないようにガチョウ小屋に隠れていたのを、ガチョウが騒ぎ立てたために見つかってしまい、結局司教に就任せざるを得なくなったため、「罰」として、ガチョウを食べるようになったというエピソードがある[4]。

ドイツ南部では、この日の前夜に「狼払い」が行われる。若者や子供たちがご馳走を食べた後、聖マルティヌスに扮装して、カウベルや鞭、場所によっては太鼓を鳴らして「狼よ、出て行け!」と叫ぶ。元々は悪魔払いに端を発していると考えられる。

また、アルプスに近い地方では、カスマンドル払いが行われる。カスマンドルは山の精霊で、夏、山に家畜を放牧する時期、面倒を見てくれると考えられており、人々は、秋になって家畜と共に山を降りる際、この精霊のために、自分たちが作ったチーズを少量残して下山する。カスマンドルとは、元々「チーズの精霊」を意味するケーゼメンラインであるといわれ、そのカスマンドルが、山から下りて来て、人里で悪さを働くことのないよう、やはり若者たちがカウベルや太鼓を鳴らして追い払う[5]。

スペインではこの日にブタを屠殺・解体して冬に備える慣わし、マタンサがある。このため、「それぞれのブタにサン・マルティンの日が来る」ということわざがある。ブタのような見下げ果てた人間にもいずれ悪事のツケが廻ってくる、という語意である[6]。

src, wikipedia
"""

agent = Agent(
    name="summarizer",
    model=config.MODEL,
    instruction="与えられた日本語の文章を3行以内で要約して。固有名詞や数値は省略しないこと。",
)


async def summarize(text: str) -> str:
    session_service = InMemorySessionService()
    session = await session_service.create_session(app_name="gemini-adk", user_id="local-demo")
    runner = Runner(agent=agent, app_name="gemini-adk", session_service=session_service)

    answer = ""
    async for event in runner.run_async(
        user_id="local-demo",
        session_id=session.id,
        new_message=types.Content(role="user", parts=[types.Part.from_text(text=text)]),
    ):
        if event.is_final_response() and event.content and event.content.parts:
            answer = "".join(part.text or "" for part in event.content.parts if not getattr(part, "thought", False))
    return answer


def main() -> None:
    parser = argparse.ArgumentParser(description="ADK (Python) で文章を要約する")
    parser.add_argument("text", nargs="?", default=SAMPLE_TEXT, help="要約したいテキスト(省略時はサンプル文章)")
    args = parser.parse_args()

    result = asyncio.run(summarize(args.text))
    print(result)


if __name__ == "__main__":
    main()
