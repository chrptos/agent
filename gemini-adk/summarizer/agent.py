import os

from google.adk.agents import Agent

root_agent = Agent(
    name="summarizer",
    model=os.environ.get("GEMINI_MODEL", "gemini-2.5-flash"),
    instruction="与えられた日本語の文章を3行以内で要約して。固有名詞や数値は省略しないこと。",
)
