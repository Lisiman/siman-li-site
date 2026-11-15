// What the owner says: Siman's lines, most of them recorded in her (AI-made) voice (VOICED).
// The humour is the owner's sales talk, never "Chinese people love money". 5–8 lines a pool is plenty.

export type Pool =
  | 'open'        // the opening: he asks how you'll pay
  | 'payCash'     // paid with cash
  | 'payTap'      // paid by tapping
  | 'payBoth'     // has now paid both ways
  | 'first'       // the very first throw
  | 'miss'        // missed
  | 'missStreak'  // missed 3, 5, 8… in a row
  | 'near'        // so close
  | 'clink'       // knocked a prize
  | 'win'         // ringed one
  | 'streak'      // ringed two or more in a row
  | 'owner'       // hit the owner
  | 'idle'        // standing there doing nothing
  | 'hoverCash'   // pointing at the cash tin, before paying
  | 'jackpot'     // ringed one of the big prizes (the top row)
  | 'mine'        // ringed the owner's own controller
  | 'end'         // the round is over: which of these depends on how it went (END)
  | 'empty'       // out of rings, and still standing there
  | 'restock'     // she's filled the empty places with something new
  | 'restockNew'  // …and some of it you've never seen before
  | 'complete';   // you've found every prize there is

export const LINES: Record<Pool, string[]> = {
  open: ['Hey, hey! Welcome to Lucky 88!', "Oh, look who's here! Feeling lucky?", "Come on and play! Don't be shy.", 'Ten rings, five bucks. What a deal, right?', 'Five bucks for ten chances at glory!'],
  payCash: ['Cash? In this economy? Bold choice.', 'Cash? Okayyy, old school.', 'Cash? Sure. Let me find my time machine.', 'Cash? Wow. Vintage. I respect that.', "Wait, actual money? Awwww... That's adorable."],
  payTap: ['Look at you, living in the future!', 'Okay, VIP! I see you!', "Ooh, tap and play! Now we're talking!", 'Smooth payment. Smooth moves. I like it.', 'Tap to pay? Okay, I like your style!', "Tap, tap! That's how we do it!"],
  payBoth: ['Cash AND tap? You\'re my favourite customer.', 'Both ways! Boss, you\'re making my day.'],
  first: ['Nice and easy. Underhand.', 'Aim for the tea. The tea likes you.'],
  miss: ['Nice try, though!', 'Ooh, so close!', 'That was... interesting.', 'Haha, the floor thanks you.'],
  missStreak: ['Should I move the prizes closer?', "You know you're supposed to hit the prizes, right?", 'I believe in you. Sort of.', 'Are you aiming with your eyes closed?'],
  near: ['Almost!', 'Okay, that was actually pretty good!'],
  clink: ['Careful, careful, that\'s glass.', 'Hey, gentle!'],
  win: ["Beginner's luck? Maybe!", 'Oh! We have a winner!', 'Okayyy! Look at you!', 'Wait, you actually got one!', 'Well, well, well!'],
  streak: ["Alright, now you're just flexing.", 'Hey! Leave some prizes for everyone else!', 'Okay, show-off!', 'Who taught you that?!', "You're literally robbing me right now.", 'Wait, should I be worried about my business?'],
  owner: ["Hey! I'm not a prize!", "Hey! This is a ring toss, not dodgeball.", "I'm calling HR. Oh wait, I'm HR.", "I literally work here!", "Aiya! Not the face…"],
  idle: ['Rings don\'t throw themselves.', 'Just looking? Looking is free. Rings are not.'],
  hoverCash: ["Cash? I see you're an old school, huh?"],   // (not used now: hovering the tin says a payCash line, recorded)
  jackpot: ["I want a rematch!", "Okay, that's actually insane!", "I'm gonna go bankrupt at this rate!", "NO WAY! You got THAT one?!", "Somebody call the newspaper!"],
  restock: ['Fresh stock! Just for you.', 'Restocked. Try not to rob me this time.'],
  restockNew: ["Ooh, you haven't seen that one yet, have you?", "New arrivals! Straight from my auntie's basement."],
  // the whole collection (the first, nine times in ten: stall.ts)
  complete: [
    "Well, that was a short-lived business. I guess I'm back on LinkedIn.",
    "You got ALL of them?! ...Okay, now you're just shopping.",
    'You know what? Just take the whole store.',
    'I think I just went bankrupt.',
  ],
  mine: ["Aiya! That one's mine! ...Fine. Rules are rules."],
  end: ["Congratulations. You own Lucky 88 now.", "Not bad! Wanna go again?", "That's a wrap! Come back soon!", "Well... at least you had fun. Right?", "You know what? I admire your consistency.", "Look at all those prizes! Show-off."],
  empty: ['Out of rings. Lucky you, I sell more.', 'Ten more? I give you a good price.'],
};

/** the pools Siman has recorded: line i of each is public/play/no-cash-only/voice/<pool>-<i+1>.mp3 (made from
 *  _source/voice/), so keep these lists in the order of the files. The rest are shown, not said. */
export const VOICED: Pool[] = ['open', 'payCash', 'payTap', 'miss', 'missStreak', 'near', 'win', 'streak', 'jackpot', 'end', 'owner', 'mine', 'restock', 'restockNew', 'complete'];
/** which of the 'end' lines, by how the round went: prizes won */
export const END = { great: [0, 5], ok: [1, 2], bad: [3, 4] } as const;
export const endMood = (wins: number): keyof typeof END => (wins >= 3 ? 'great' : wins >= 1 ? 'ok' : 'bad');

/** what his terminal shows when he isn't saying anything */
export const STATUS = {
  /** your chances, worked out from where you are aiming (odds.ts) */
  odds: (pct: number): string => `Next throw: ≈ ${pct < 1 && pct > 0 ? '<1' : Math.round(pct)}% success.\nStill wanna try? (Y/N)`,
  /** no rings left, or none bought yet */
  broke: 'No rings, no prize.\n10 rings, $5.  ← cash  or  tap →',
};

/** the questions the player can ask (layer 3) */
export const ASK: { id: string; q: string; a: string[] }[] = [
  { id: 'cash', q: 'Cash only?', a: ['That banner? Came with the stall. Now we all tap and pay la.'] },
  { id: 'rigged', q: 'Is this rigged?', a: ['Rigged? Me? I\'m offended. Mostly.'] },
  { id: 'best', q: 'Best prize?', a: ['The rice cooker. Nobody wins the rice cooker.'] },
  { id: 'who', q: 'Who are you?', a: ['Me? I\'m Siman. Also available for hire, by the way.'] },
];
